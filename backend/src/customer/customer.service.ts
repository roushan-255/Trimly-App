import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth-user";
import { Prisma } from "../generated/prisma/client";
import {
  AppointmentStatus,
  BarberMembershipStatus,
  TimeSlotStatus,
} from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import {
  RescheduleBookingDto,
  SubmitBookingReviewDto,
} from "./dto/customer-bookings.dto";

const bookingInclude = {
  shop: {
    select: {
      id: true,
      name: true,
      addressLine1: true,
      addressLine2: true,
      locality: true,
      city: true,
      state: true,
      postalCode: true,
      timezone: true,
    },
  },
  barber: { select: { id: true, displayName: true } },
  service: { select: { id: true, name: true, price: true } },
  timeSlot: { select: { id: true, startsAt: true, endsAt: true } },
  review: {
    select: {
      id: true,
      shopRating: true,
      shopComment: true,
      barberRating: true,
      barberComment: true,
      createdAt: true,
    },
  },
} satisfies Prisma.AppointmentInclude;

type BookingAppointment = Prisma.AppointmentGetPayload<{
  include: typeof bookingInclude;
}>;

const changeableStatuses: AppointmentStatus[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
];

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async listBookings(user: AuthenticatedUser) {
    const customerId = await this.customerId(user.id);
    const appointments = await this.prisma.appointment.findMany({
      where: { customerId },
      include: bookingInclude,
      orderBy: { timeSlot: { startsAt: "desc" } },
    });
    const groups = new Map<string, BookingAppointment[]>();

    for (const appointment of appointments) {
      const current = groups.get(appointment.bookingGroupId) ?? [];
      current.push(appointment);
      groups.set(appointment.bookingGroupId, current);
    }

    const now = new Date();
    const bookings = [...groups.entries()].map(([id, items]) =>
      this.toBooking(id, items, now),
    );

    return {
      upcoming: bookings
        .filter((booking) => booking.isUpcoming)
        .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime()),
      past: bookings
        .filter((booking) => !booking.isUpcoming)
        .sort((left, right) => right.startsAt.getTime() - left.startsAt.getTime()),
    };
  }

  async cancelBooking(user: AuthenticatedUser, bookingGroupId: string) {
    const customerId = await this.customerId(user.id);

    return this.handleBookingTransaction(async (transaction) => {
      const appointments = await transaction.appointment.findMany({
        where: { bookingGroupId, customerId },
        select: {
          id: true,
          status: true,
          timeSlotId: true,
          timeSlot: { select: { startsAt: true } },
        },
      });
      this.assertChangeable(appointments, "cancel");

      await transaction.appointment.updateMany({
        where: { bookingGroupId, customerId },
        data: { status: AppointmentStatus.CANCELLED },
      });
      await transaction.timeSlot.updateMany({
        where: {
          id: { in: appointments.map(({ timeSlotId }) => timeSlotId) },
          status: TimeSlotStatus.BOOKED,
        },
        data: { status: TimeSlotStatus.AVAILABLE },
      });

      return { bookingGroupId, status: AppointmentStatus.CANCELLED };
    });
  }

  async rescheduleBooking(
    user: AuthenticatedUser,
    bookingGroupId: string,
    dto: RescheduleBookingDto,
  ) {
    const slotIds = [...new Set(dto.slotIds)];
    if (slotIds.length !== dto.slotIds.length) {
      throw new BadRequestException("Slots cannot be duplicated");
    }
    const customerId = await this.customerId(user.id);

    return this.handleBookingTransaction(async (transaction) => {
      const appointments = await transaction.appointment.findMany({
        where: { bookingGroupId, customerId },
        orderBy: { timeSlot: { startsAt: "asc" } },
        select: {
          id: true,
          status: true,
          shopId: true,
          barberId: true,
          timeSlotId: true,
          timeSlot: { select: { startsAt: true } },
        },
      });
      this.assertChangeable(appointments, "reschedule");

      if (slotIds.length !== appointments.length) {
        throw new BadRequestException(
          "Select the same number of 10-minute slots as the original booking",
        );
      }
      const originalSlotIds = new Set(
        appointments.map(({ timeSlotId }) => timeSlotId),
      );
      if (slotIds.some((slotId) => originalSlotIds.has(slotId))) {
        throw new BadRequestException("Please choose a new appointment time");
      }

      const [{ shopId, barberId }] = appointments;
      const [membership, slots] = await Promise.all([
        transaction.shopBarberMembership.findFirst({
          where: {
            shopId,
            barberId,
            status: BarberMembershipStatus.ACTIVE,
          },
          select: { id: true },
        }),
        transaction.timeSlot.findMany({
          where: { id: { in: slotIds }, barberId },
          orderBy: { startsAt: "asc" },
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            status: true,
          },
        }),
      ]);

      if (!membership) {
        throw new NotFoundException("This barber is no longer active at the shop");
      }
      if (slots.length !== slotIds.length) {
        throw new ConflictException("One or more slots are no longer available");
      }

      const now = new Date();
      slots.forEach((slot, index) => {
        if (
          slot.status !== TimeSlotStatus.AVAILABLE ||
          slot.startsAt <= now ||
          slot.endsAt.getTime() - slot.startsAt.getTime() !== 600_000 ||
          (index > 0 && slot.startsAt.getTime() !== slots[index - 1].endsAt.getTime())
        ) {
          throw new ConflictException(
            "Choose consecutive, available 10-minute slots in the future",
          );
        }
      });

      const reserved = await transaction.timeSlot.updateMany({
        where: {
          id: { in: slotIds },
          barberId,
          status: TimeSlotStatus.AVAILABLE,
          startsAt: { gt: now },
        },
        data: { status: TimeSlotStatus.BOOKED },
      });
      if (reserved.count !== slots.length) {
        throw new ConflictException(
          "These slots were just booked by another customer",
        );
      }

      for (let index = 0; index < appointments.length; index += 1) {
        await transaction.appointment.update({
          where: { id: appointments[index].id },
          data: { timeSlotId: slots[index].id },
        });
      }
      await transaction.timeSlot.updateMany({
        where: {
          id: { in: [...originalSlotIds] },
          status: TimeSlotStatus.BOOKED,
        },
        data: { status: TimeSlotStatus.AVAILABLE },
      });

      return {
        bookingGroupId,
        status: appointments[0].status,
        startsAt: slots[0].startsAt,
        endsAt: slots.at(-1)?.endsAt,
      };
    });
  }

  async submitReview(
    user: AuthenticatedUser,
    bookingGroupId: string,
    dto: SubmitBookingReviewDto,
  ) {
    const customerId = await this.customerId(user.id);
    const appointments = await this.prisma.appointment.findMany({
      where: { bookingGroupId, customerId },
      orderBy: { timeSlot: { startsAt: "asc" } },
      select: {
        id: true,
        shopId: true,
        barberId: true,
        status: true,
        review: { select: { id: true } },
      },
    });

    if (!appointments.length) throw new NotFoundException("Booking not found");
    if (appointments.some(({ status }) => status !== AppointmentStatus.COMPLETED)) {
      throw new ConflictException("Only completed bookings can be reviewed");
    }
    if (appointments.some(({ review }) => review !== null)) {
      throw new ConflictException("This booking has already been reviewed");
    }

    const appointment = appointments[0];
    try {
      return await this.prisma.review.create({
        data: {
          customerId,
          shopId: appointment.shopId,
          barberId: appointment.barberId,
          appointmentId: appointment.id,
          shopRating: dto.shopRating,
          shopComment: dto.shopComment?.trim() || null,
          barberRating: dto.barberRating,
          barberComment: dto.barberComment?.trim() || null,
        },
        select: {
          id: true,
          shopRating: true,
          shopComment: true,
          barberRating: true,
          barberComment: true,
          createdAt: true,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("This booking has already been reviewed");
      }
      throw error;
    }
  }

  private async customerId(userId: string) {
    const customer = await this.prisma.customerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!customer) throw new NotFoundException("Customer profile not found");
    return customer.id;
  }

  private assertChangeable(
    appointments: { status: AppointmentStatus; timeSlot: { startsAt: Date } }[],
    action: string,
  ) {
    if (!appointments.length) throw new NotFoundException("Booking not found");
    if (appointments.some(({ status }) => !changeableStatuses.includes(status))) {
      throw new ConflictException(`This booking cannot be ${action}d`);
    }
    if (appointments.some(({ timeSlot }) => timeSlot.startsAt <= new Date())) {
      throw new ConflictException(`Past bookings cannot be ${action}d`);
    }
  }

  private toBooking(id: string, appointments: BookingAppointment[], now: Date) {
    const items = [...appointments].sort(
      (left, right) => left.timeSlot.startsAt.getTime() - right.timeSlot.startsAt.getTime(),
    );
    const first = items[0];
    const last = items.at(-1) ?? first;
    const status = first.status;
    const isUpcoming = changeableStatuses.includes(status) && first.timeSlot.startsAt > now;

    return {
      id,
      status,
      isUpcoming,
      startsAt: first.timeSlot.startsAt,
      endsAt: last.timeSlot.endsAt,
      durationMin: Math.round(
        (last.timeSlot.endsAt.getTime() - first.timeSlot.startsAt.getTime()) / 60_000,
      ),
      totalPrice: items
        .reduce((total, item) => total + Number(item.service.price), 0)
        .toFixed(2),
      notes: first.notes,
      shop: first.shop,
      barber: first.barber,
      services: items.map(({ service }) => ({
        ...service,
        price: service.price.toString(),
      })),
      review: items.find(({ review }) => review)?.review ?? null,
      canCancel: isUpcoming,
      canReschedule: isUpcoming,
    };
  }

  private async handleBookingTransaction<T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  ) {
    try {
      return await this.prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 15_000,
        timeout: 20_000,
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2028") {
        throw new ServiceUnavailableException(
          "The booking database is busy. Please try again.",
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2002", "P2034"].includes(error.code)
      ) {
        throw new ConflictException(
          "The booking changed while you were updating it. Please try again.",
        );
      }
      throw error;
    }
  }
}
