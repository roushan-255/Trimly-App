import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import {
  BarberMembershipStatus,
  KycStatus,
  TimeSlotStatus,
} from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import {
  LocationSuggestionDto,
  ShopSearchDto,
  ShopSort,
} from "./dto/shop-search.dto";

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
