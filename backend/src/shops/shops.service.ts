import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { AuthenticatedUser } from "../auth/auth-user";
import { Prisma } from "../generated/prisma/client";
import {
  AppointmentStatus,
  BarberMembershipStatus,
  KycStatus,
  TimeSlotStatus,
} from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import {
  BarberAvailabilityDto,
  LocationSuggestionDto,
  ShopSearchDto,
  ShopSort,
} from "./dto/shop-search.dto";
import { CreateBookingDto } from "./dto/create-booking.dto";

const publicShopSelect = {
  id: true,
  name: true,
  description: true,
  phone: true,
  email: true,
  addressLine1: true,
  addressLine2: true,
  locality: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  createdAt: true,
  owner: {
    select: {
      kycStatus: true,
    },
  },
  barberMemberships: {
    where: {
      status: BarberMembershipStatus.ACTIVE,
      barber: { isDiscoverable: true },
    },
    orderBy: { createdAt: "asc" as const },
    select: {
      barber: {
        select: {
          id: true,
          displayName: true,
          bio: true,
        },
      },
    },
  },
  services: {
    where: { isActive: true },
    orderBy: { price: "asc" as const },
    select: {
      id: true,
      name: true,
      description: true,
      durationMin: true,
      price: true,
    },
  },
  reviews: {
    select: {
      rating: true,
    },
  },
} satisfies Prisma.ShopSelect;

type PublicShopPayload = Prisma.ShopGetPayload<{
  select: typeof publicShopSelect;
}>;

type ComparableShop = {
  name: string;
  createdAt: Date;
  rating: number | null;
  reviewCount: number;
  verified: boolean;
  startingPrice: string | null;
};

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  async locationSuggestions(query: LocationSuggestionDto) {
    const term = this.locationTerm(query.query);
    const locations = await this.prisma.shop.findMany({
      where: {
        locality: { not: null },
        ...(term
          ? {
              OR: [
                { locality: { contains: term, mode: "insensitive" } },
                { city: { contains: term, mode: "insensitive" } },
                { postalCode: { contains: term, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      distinct: ["locality", "city"],
      orderBy: [{ city: "asc" }, { locality: "asc" }],
      take: query.limit,
      select: { locality: true, city: true, state: true },
    });

    return locations.flatMap((location) =>
      location.locality
        ? [
            {
              locality: location.locality,
              city: location.city,
              state: location.state,
              label: `${location.locality}, ${location.city}`,
            },
          ]
        : [],
    );
  }

  async serviceOptions(location?: string) {
    const locationTerm = this.locationTerm(location);
    const services = await this.prisma.service.findMany({
      where: {
        isActive: true,
        ...(locationTerm
          ? { shop: { OR: this.locationConditions(locationTerm) } }
          : {}),
      },
      distinct: ["name"],
      orderBy: { name: "asc" },
      select: { name: true },
    });

    return services.map(({ name }) => name);
  }

  async list(query: ShopSearchDto) {
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException(
        "Minimum price cannot be greater than maximum price",
      );
    }

    const where = this.searchWhere(query);
    const shops = await this.prisma.shop.findMany({
      where,
      select: publicShopSelect,
    });

    const matchingShops = shops
      .map((shop) => this.toPublicShop(shop))
      .filter(
        (shop) =>
          query.minRating === undefined ||
          (shop.rating !== null && shop.rating >= query.minRating),
      )
      .sort((left, right) => this.compareShops(left, right, query.sort));

    const total = matchingShops.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);
    const offset = (query.page - 1) * query.limit;

    return {
      items: matchingShops.slice(offset, offset + query.limit),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasPreviousPage: query.page > 1,
        hasNextPage: query.page < totalPages,
      },
    };
  }

  async getById(shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: publicShopSelect,
    });

    if (!shop) {
      throw new NotFoundException("Shop not found");
    }

    return this.toPublicShop(shop);
  }

  async barberAvailability(
    shopId: string,
    barberId: string,
    query: BarberAvailabilityDto,
  ) {
    const membership = await this.prisma.shopBarberMembership.findFirst({
      where: {
        shopId,
        barberId,
        status: BarberMembershipStatus.ACTIVE,
        barber: { isDiscoverable: true },
      },
      select: {
        barber: {
          select: {
            id: true,
            displayName: true,
            bio: true,
            profileImageUrl: true,
            specialties: true,
            reviews: {
              where: { shopId },
              select: { rating: true },
            },
            services: {
              select: {
                serviceId: true,
                durationOverrideMin: true,
              },
            },
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            timezone: true,
            services: {
              where: { isActive: true },
              orderBy: { price: "asc" },
              select: {
                id: true,
                name: true,
                description: true,
                durationMin: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException("Active barber not found for this shop");
    }

    const assignedServices = membership.barber.services;
    const assignedServiceIds = new Set(
      assignedServices.map((service) => service.serviceId),
    );
    const services = membership.shop.services
      .filter(
        (service) =>
          assignedServiceIds.size === 0 || assignedServiceIds.has(service.id),
      )
      .map((service) => ({
        ...service,
        durationMin: 10,
        price: service.price.toString(),
      }));
    const requestedServiceIds = [
      ...new Set(
        query.serviceId?.length
          ? query.serviceId
          : services[0]
            ? [services[0].id]
            : [],
      ),
    ];
    const selectedServices = requestedServiceIds.flatMap((serviceId) => {
      const service = services.find((candidate) => candidate.id === serviceId);
      return service ? [service] : [];
    });

    if (selectedServices.length !== requestedServiceIds.length) {
      throw new NotFoundException(
        "Active service not found for this barber and shop",
      );
    }

    const { start, end } = this.zonedDateRange(
      query.date,
      membership.shop.timezone,
    );
    const slots = await this.prisma.timeSlot.findMany({
      where: {
        barberId,
        startsAt: { gte: start, lt: end },
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
      },
    });
    const now = new Date();
    const totalDurationMin = selectedServices.length * 10;
    const bookableSlotGroups = totalDurationMin
      ? this.bookableSlotGroups(slots, totalDurationMin, now)
      : new Map<string, string[]>();
    const reviews = membership.barber.reviews;
    const rating = reviews.length
      ? Number(
          (
            reviews.reduce((total, review) => total + review.rating, 0) /
            reviews.length
          ).toFixed(1),
        )
      : null;

    return {
      shop: {
        id: membership.shop.id,
        name: membership.shop.name,
        timezone: membership.shop.timezone,
      },
      barber: {
        id: membership.barber.id,
        displayName: membership.barber.displayName,
        bio: membership.barber.bio,
        profileImageUrl: membership.barber.profileImageUrl,
        specialties: membership.barber.specialties,
        rating,
        reviewCount: reviews.length,
      },
      services,
      selectedServiceIds: selectedServices.map((service) => service.id),
      totalDurationMin,
      slots: slots
        .filter(
          (slot) =>
            (slot.status === TimeSlotStatus.AVAILABLE ||
              slot.status === TimeSlotStatus.BOOKED) &&
            slot.startsAt > now,
        )
        .map((slot) => ({
          ...slot,
          bookable: bookableSlotGroups.has(slot.id),
          occupiedSlotIds: bookableSlotGroups.get(slot.id) ?? [],
        })),
    };
  }

  async createBooking(
    user: AuthenticatedUser,
    shopId: string,
    barberId: string,
    dto: CreateBookingDto,
  ) {
    const serviceIds = [...new Set(dto.serviceIds)];
    const slotIds = [...new Set(dto.slotIds)];

    if (
      serviceIds.length !== dto.serviceIds.length ||
      slotIds.length !== dto.slotIds.length
    ) {
      throw new BadRequestException("Services and slots cannot be duplicated");
    }
    if (serviceIds.length !== slotIds.length) {
      throw new BadRequestException(
        "Each 10-minute service requires one 10-minute slot",
      );
    }

    try {
      return await this.prisma.$transaction(
        async (transaction) => {
          const [customer, membership, services, slots] = await Promise.all([
            transaction.customerProfile.findUnique({
              where: { userId: user.id },
              select: { id: true },
            }),
            transaction.shopBarberMembership.findFirst({
              where: {
                shopId,
                barberId,
                status: BarberMembershipStatus.ACTIVE,
              },
              select: { id: true },
            }),
            transaction.service.findMany({
              where: {
                id: { in: serviceIds },
                shopId,
                isActive: true,
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

          if (!customer) throw new NotFoundException("Customer profile not found");
          if (!membership) {
            throw new NotFoundException("Active barber not found for this shop");
          }
          if (services.length !== serviceIds.length) {
            throw new NotFoundException("One or more services are not available");
          }
          if (slots.length !== slotIds.length) {
            throw new ConflictException("One or more slots are no longer available");
          }

          const now = new Date();
          for (let index = 0; index < slots.length; index += 1) {
            const slot = slots[index];
            if (
              slot.status !== TimeSlotStatus.AVAILABLE ||
              slot.startsAt <= now
            ) {
              throw new ConflictException(
                "One or more slots are no longer available",
              );
            }
            if (slot.endsAt.getTime() - slot.startsAt.getTime() !== 600_000) {
              throw new ConflictException("Selected slots are not 10-minute slots");
            }
            if (
              index > 0 &&
              slot.startsAt.getTime() !== slots[index - 1].endsAt.getTime()
            ) {
              throw new ConflictException("Selected slots are not consecutive");
            }
          }

          const reserved = await transaction.timeSlot.updateMany({
            where: {
              id: { in: slotIds },
              barberId,
              status: TimeSlotStatus.AVAILABLE,
              startsAt: { gt: now },
            },
            data: { status: TimeSlotStatus.BOOKED },
          });
          if (reserved.count !== slotIds.length) {
            throw new ConflictException(
              "These slots were just booked by another customer",
            );
          }

          const appointments = slots.map((slot, index) => ({
            id: randomUUID(),
            customerId: customer.id,
            shopId,
            barberId,
            serviceId: serviceIds[index],
            timeSlotId: slot.id,
            status: AppointmentStatus.CONFIRMED,
            notes: dto.notes?.trim() || null,
          }));
          await transaction.appointment.createMany({ data: appointments });

          return {
            appointmentIds: appointments.map((appointment) => appointment.id),
            status: AppointmentStatus.CONFIRMED,
            startsAt: slots[0].startsAt,
            endsAt: slots.at(-1)?.endsAt,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 15_000,
          timeout: 20_000,
        },
      );
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2028"
      ) {
        throw new ServiceUnavailableException(
          "The booking database is busy. Please try confirming again.",
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2002", "P2034"].includes(error.code)
      ) {
        throw new ConflictException(
          "These slots were just booked by another customer",
        );
      }
      throw error;
    }
  }

  private bookableSlotGroups(
    slots: {
      id: string;
      startsAt: Date;
      endsAt: Date;
      status: TimeSlotStatus;
    }[],
    durationMin: number,
    now: Date,
  ) {
    const bookable = new Map<string, string[]>();

    for (let index = 0; index < slots.length; index += 1) {
      const first = slots[index];
      if (
        first.status !== TimeSlotStatus.AVAILABLE ||
        first.startsAt <= now
      ) {
        continue;
      }

      const requiredEnd = first.startsAt.getTime() + durationMin * 60_000;
      let coverageEnd = first.startsAt.getTime();
      let cursor = index;
      const occupiedSlotIds: string[] = [];

      while (coverageEnd < requiredEnd && cursor < slots.length) {
        const next = slots[cursor];
        if (
          next.status !== TimeSlotStatus.AVAILABLE ||
          next.startsAt.getTime() !== coverageEnd
        ) {
          break;
        }
        if (next.endsAt <= next.startsAt) break;
        occupiedSlotIds.push(next.id);
        coverageEnd = next.endsAt.getTime();
        cursor += 1;
      }

      if (coverageEnd >= requiredEnd) {
        bookable.set(first.id, occupiedSlotIds);
      }
    }

    return bookable;
  }

  private zonedDateRange(date: string, timezone: string) {
    const [year, month, day] = date.split("-").map(Number);
    const calendarDate = new Date(Date.UTC(year, month - 1, day));

    if (
      !Number.isFinite(calendarDate.getTime()) ||
      calendarDate.getUTCFullYear() !== year ||
      calendarDate.getUTCMonth() !== month - 1 ||
      calendarDate.getUTCDate() !== day
    ) {
      throw new BadRequestException("Invalid date");
    }

    try {
      const nextDate = new Date(calendarDate.getTime() + 86_400_000);
      return {
        start: this.zonedMidnightToUtc(year, month, day, timezone),
        end: this.zonedMidnightToUtc(
          nextDate.getUTCFullYear(),
          nextDate.getUTCMonth() + 1,
          nextDate.getUTCDate(),
          timezone,
        ),
      };
    } catch {
      throw new BadRequestException("Invalid shop timezone");
    }
  }

  private zonedMidnightToUtc(
    year: number,
    month: number,
    day: number,
    timezone: string,
  ) {
    const intended = Date.UTC(year, month - 1, day);
    let guess = intended;
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });

    for (let iteration = 0; iteration < 2; iteration += 1) {
      const parts = formatter.formatToParts(new Date(guess));
      const values = Object.fromEntries(
        parts
          .filter((part) => part.type !== "literal")
          .map((part) => [part.type, Number(part.value)]),
      );
      const represented = Date.UTC(
        values.year,
        values.month - 1,
        values.day,
        values.hour,
        values.minute,
        values.second,
      );
      guess += intended - represented;
    }

    return new Date(guess);
  }

  private searchWhere(query: ShopSearchDto): Prisma.ShopWhereInput | undefined {
    const conditions: Prisma.ShopWhereInput[] = [];
    const location = this.locationTerm(query.location);

    if (location) {
      conditions.push({ OR: this.locationConditions(location) });
    }

    if (query.name) {
      conditions.push({
        name: { contains: query.name, mode: "insensitive" },
      });
    }

    const price = this.priceFilter(query.minPrice, query.maxPrice);
    if (query.service?.length) {
      conditions.push(
        ...query.service.map((service) => ({
          services: {
            some: {
              isActive: true,
              name: { equals: service, mode: "insensitive" as const },
              ...(price ? { price } : {}),
            },
          },
        })),
      );
    } else if (price) {
      conditions.push({ services: { some: { isActive: true, price } } });
    }

    if (query.verifiedOnly) {
      conditions.push({ owner: { kycStatus: KycStatus.VERIFIED } });
    }

    if (query.date) {
      const { start, end } = this.dateRange(query.date);
      conditions.push({
        barberMemberships: {
          some: {
            status: BarberMembershipStatus.ACTIVE,
            barber: {
              isDiscoverable: true,
              timeSlots: {
                some: {
                  status: TimeSlotStatus.AVAILABLE,
                  startsAt: { gte: start, lt: end },
                },
              },
            },
          },
        },
      });
    }

    return conditions.length ? { AND: conditions } : undefined;
  }

  private locationConditions(location: string): Prisma.ShopWhereInput[] {
    return [
      { locality: { contains: location, mode: "insensitive" } },
      { city: { contains: location, mode: "insensitive" } },
      { postalCode: { contains: location, mode: "insensitive" } },
    ];
  }

  private locationTerm(location?: string) {
    return location?.split(",", 1)[0]?.trim();
  }

  private priceFilter(minPrice?: number, maxPrice?: number) {
    if (minPrice === undefined && maxPrice === undefined) return undefined;
    return {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    } satisfies Prisma.DecimalFilter;
  }

  private dateRange(date: string) {
    const startOfDay = new Date(`${date}T00:00:00+05:30`);
    const end = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1_000);
    const now = new Date();
    return {
      start: startOfDay > now ? startOfDay : now,
      end,
    };
  }

  private compareShops(
    left: ComparableShop,
    right: ComparableShop,
    sort: ShopSort,
  ) {
    if (sort === ShopSort.NEWEST) {
      return right.createdAt.getTime() - left.createdAt.getTime();
    }

    const leftPrice = left.startingPrice
      ? Number.parseFloat(left.startingPrice)
      : Number.POSITIVE_INFINITY;
    const rightPrice = right.startingPrice
      ? Number.parseFloat(right.startingPrice)
      : Number.POSITIVE_INFINITY;

    if (sort === ShopSort.PRICE_LOW) {
      return leftPrice - rightPrice || left.name.localeCompare(right.name);
    }

    if (sort === ShopSort.PRICE_HIGH) {
      const leftHighPrice = left.startingPrice
        ? leftPrice
        : Number.NEGATIVE_INFINITY;
      const rightHighPrice = right.startingPrice
        ? rightPrice
        : Number.NEGATIVE_INFINITY;
      return (
        rightHighPrice - leftHighPrice || left.name.localeCompare(right.name)
      );
    }

    return (
      (right.rating ?? -1) - (left.rating ?? -1) ||
      right.reviewCount - left.reviewCount ||
      Number(right.verified) - Number(left.verified) ||
      left.name.localeCompare(right.name)
    );
  }

  private toPublicShop(shop: PublicShopPayload) {
    const reviewCount = shop.reviews.length;
    const rating =
      reviewCount > 0
        ? shop.reviews.reduce((total, review) => total + review.rating, 0) /
          reviewCount
        : null;

    return {
      id: shop.id,
      name: shop.name,
      description: shop.description,
      phone: shop.phone,
      email: shop.email,
      addressLine1: shop.addressLine1,
      addressLine2: shop.addressLine2,
      locality: shop.locality,
      city: shop.city,
      state: shop.state,
      postalCode: shop.postalCode,
      country: shop.country,
      createdAt: shop.createdAt,
      verified: shop.owner.kycStatus === KycStatus.VERIFIED,
      rating: rating === null ? null : Number(rating.toFixed(1)),
      reviewCount,
      barberCount: shop.barberMemberships.length,
      serviceCount: shop.services.length,
      startingPrice:
        shop.services.length > 0 ? shop.services[0].price.toString() : null,
      barbers: shop.barberMemberships.map(({ barber }) => barber),
      services: shop.services.map((service) => ({
        ...service,
        price: service.price.toString(),
      })),
    };
  }
}
