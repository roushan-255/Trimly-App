import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import {
  BarberMembershipStatus,
  UserRole,
} from "../generated/prisma/enums";
import type { AuthenticatedUser } from "../auth/auth-user";
import { PasswordService } from "../auth/password.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBarberDto, CreateShopDto } from "./dto/owner.dto";

const ownerShopSelect = {
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
  barberMemberships: {
    where: { status: BarberMembershipStatus.ACTIVE },
    orderBy: { createdAt: "asc" as const },
    select: {
      barber: {
        select: {
          id: true,
          displayName: true,
          bio: true,
          createdAt: true,
          user: { select: { email: true, phone: true } },
        },
      },
    },
  },
} satisfies Prisma.ShopSelect;

type OwnerShopPayload = Prisma.ShopGetPayload<{
  select: typeof ownerShopSelect;
}>;

@Injectable()
export class OwnerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
  ) {}

  async listShops(user: AuthenticatedUser) {
    this.assertOwner(user);
    const shops = await this.prisma.shop.findMany({
      where: { owner: { userId: user.id } },
      orderBy: { createdAt: "asc" },
      select: ownerShopSelect,
    });
    return shops.map((shop) => this.toOwnerShop(shop));
  }

  async createShop(user: AuthenticatedUser, dto: CreateShopDto) {
    this.assertOwner(user);
    const owner = await this.prisma.shopOwnerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!owner) throw new NotFoundException("Shop owner profile not found");

    const shop = await this.prisma.shop.create({
      data: { ownerId: owner.id, ...this.shopData(dto) },
      select: ownerShopSelect,
    });
    return this.toOwnerShop(shop);
  }

  async addBarber(
    user: AuthenticatedUser,
    shopId: string,
    dto: CreateBarberDto,
  ) {
    const shop = await this.getOwnedShop(user, shopId);
    const passwordHash = await this.passwords.hash(dto.password);

    try {
      const createdUser = await this.prisma.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          roles: [UserRole.BARBER],
          roleCredentials: {
            create: { role: UserRole.BARBER, passwordHash },
          },
          barberProfile: {
            create: {
              displayName: dto.displayName,
              bio: dto.bio,
              isDiscoverable: false,
              memberships: {
                create: {
                  shopId: shop.id,
                  invitedByOwnerId: shop.owner.id,
                  status: BarberMembershipStatus.ACTIVE,
                  respondedAt: new Date(),
                },
              },
            },
          },
        },
        select: {
          email: true,
          phone: true,
          barberProfile: {
            select: {
              id: true,
              displayName: true,
              bio: true,
              createdAt: true,
            },
          },
        },
      });
      if (!createdUser.barberProfile) {
        throw new NotFoundException("Barber profile was not created");
      }
      return {
        ...createdUser.barberProfile,
        user: { email: createdUser.email, phone: createdUser.phone },
      };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "An account with this barber email already exists",
        );
      }
      throw error;
    }
  }

  private async getOwnedShop(user: AuthenticatedUser, shopId: string) {
    this.assertOwner(user);
    const shop = await this.prisma.shop.findFirst({
      where: { id: shopId, owner: { userId: user.id } },
      select: { id: true, owner: { select: { id: true } } },
    });
    if (!shop) throw new NotFoundException("Shop not found");
    return shop;
  }

  private assertOwner(user: AuthenticatedUser) {
    if (user.role !== UserRole.SHOP_OWNER) {
      throw new ForbiddenException("A shop owner account is required");
    }
  }

  private toOwnerShop(shop: OwnerShopPayload) {
    const { barberMemberships, ...shopDetails } = shop;
    return {
      ...shopDetails,
      barbers: barberMemberships.map(({ barber }) => barber),
    };
  }

  private shopData(dto: CreateShopDto) {
    return {
      name: dto.name,
      description: dto.description,
      phone: dto.phone,
      email: dto.email,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      locality: dto.locality,
      city: dto.city,
      state: dto.state,
      postalCode: dto.postalCode,
      country: dto.country,
    };
  }
}
