import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { BarberMembershipStatus } from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";

const publicShopSelect = {
  id: true,
  name: true,
  description: true,
  phone: true,
  email: true,
  addressLine1: true,
  addressLine2: true,
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
    where: { status: BarberMembershipStatus.ACTIVE },
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

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(search?: string, requestedLimit = 12) {
    const limit = Math.min(Math.max(requestedLimit, 1), 50);
    const normalizedSearch = search?.trim();
    const shops = await this.prisma.shop.findMany({
      where: normalizedSearch
        ? {
            OR: [
              {
                name: {
                  contains: normalizedSearch,
                  mode: "insensitive",
                },
              },
              {
                city: {
                  contains: normalizedSearch,
                  mode: "insensitive",
                },
              },
              {
                state: {
                  contains: normalizedSearch,
                  mode: "insensitive",
                },
              },
              {
                services: {
                  some: {
                    name: {
                      contains: normalizedSearch,
                      mode: "insensitive",
                    },
                    isActive: true,
                  },
                },
              },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: publicShopSelect,
    });

    return shops.map((shop) => this.toPublicShop(shop));
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

  private toPublicShop(
    shop: Prisma.ShopGetPayload<{ select: typeof publicShopSelect }>,
  ) {
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
      city: shop.city,
      state: shop.state,
      postalCode: shop.postalCode,
      country: shop.country,
      createdAt: shop.createdAt,
      verified: shop.owner.kycStatus === "VERIFIED",
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
