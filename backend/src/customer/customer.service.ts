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
      orderBy: { createdAt: "desc" },
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
          scheduledDate: true,
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
          id: {
            in: appointments.flatMap(({ timeSlotId }) =>
              timeSlotId ? [timeSlotId] : [],
            ),
          },
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
    const customerId = await this.customerId(user.id);

    return this.handleBookingTransaction(async (transaction) => {
      const appointments = await transaction.appointment.findMany({
        where: { bookingGroupId, customerId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          status: true,
          shopId: true,
          barberId: true,
          timeSlotId: true,
          scheduledDate: true,
          timeSlot: { select: { startsAt: true } },
        },
      });
      this.assertChangeable(appointments, "reschedule");

      const [{ shopId, barberId }] = appointments;
      const membership = await transaction.shopBarberMembership.findFirst({
        where: {
          shopId,
          barberId,
          status: BarberMembershipStatus.ACTIVE,
        },
        select: { id: true },
      });

      if (!membership) {
        throw new NotFoundException("This barber is no longer active at the shop");
      }
      const scheduledDate = new Date(`${dto.date}T00:00:00.000Z`);
      if (scheduledDate.getTime() + 86_400_000 <= Date.now()) {
        throw new BadRequestException("Choose today or a future date");
      }
      const originalSlotIds = appointments.flatMap(({ timeSlotId }) =>
        timeSlotId ? [timeSlotId] : [],
      );
      await transaction.appointment.updateMany({
        where: { bookingGroupId, customerId },
        data: { scheduledDate, timeSlotId: null },
      });
      await transaction.timeSlot.updateMany({
        where: {
          id: { in: originalSlotIds },
          status: TimeSlotStatus.BOOKED,
        },
        data: { status: TimeSlotStatus.AVAILABLE },
      });

      return {
        bookingGroupId,
        status: appointments[0].status,
        visitDate: dto.date,
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
    appointments: {
      status: AppointmentStatus;
      scheduledDate: Date | null;
      timeSlot: { startsAt: Date } | null;
    }[],
    action: string,
  ) {
    if (!appointments.length) throw new NotFoundException("Booking not found");
    if (appointments.some(({ status }) => !changeableStatuses.includes(status))) {
      throw new ConflictException(`This booking cannot be ${action}d`);
    }
    if (
      appointments.some(({ scheduledDate, timeSlot }) => {
        if (timeSlot) return timeSlot.startsAt <= new Date();
        return !scheduledDate || scheduledDate.getTime() + 86_400_000 <= Date.now();
      })
    ) {
      throw new ConflictException(`Past bookings cannot be ${action}d`);
    }
  }

  private toBooking(id: string, appointments: BookingAppointment[], now: Date) {
    const items = [...appointments].sort(
      (left, right) =>
        this.appointmentStart(left).getTime() -
        this.appointmentStart(right).getTime(),
    );
    const first = items[0];
    const last = items.at(-1) ?? first;
    const status = first.status;
    const dateOnly = first.timeSlot === null;
    const startsAt = this.appointmentStart(first);
    const endsAt = last.timeSlot?.endsAt ?? startsAt;
    const isUpcoming =
      changeableStatuses.includes(status) &&
      (dateOnly
        ? startsAt.getTime() + 86_400_000 > now.getTime()
        : startsAt > now);

    return {
      id,
      status,
      isUpcoming,
      dateOnly,
      visitDate: startsAt.toISOString().slice(0, 10),
      startsAt,
      endsAt,
      durationMin: dateOnly
        ? items.length * 10
        : Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000),
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

  private appointmentStart(appointment: BookingAppointment) {
    const startsAt = appointment.timeSlot?.startsAt ?? appointment.scheduledDate;
    if (!startsAt) {
      throw new ConflictException("This booking does not have a visit date");
    }
    return startsAt;
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
