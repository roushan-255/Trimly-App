import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import {
  AppointmentStatus,
  BarberMembershipStatus,
  UserRole,
} from "../generated/prisma/enums";
import type { AuthenticatedUser } from "../auth/auth-user";
import { PasswordService } from "../auth/password.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateBarberDto,
  CreateServiceDto,
  CreateShopDto,
  UpdateBarberDto,
  UpdateServiceDto,
} from "./dto/owner.dto";

const ownerBarberSelect = {
  id: true,
  displayName: true,
  bio: true,
  createdAt: true,
  user: { select: { email: true, phone: true } },
} satisfies Prisma.BarberSelect;

const ownerServiceSelect = {
  id: true,
  name: true,
  description: true,
  durationMin: true,
  price: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.ServiceSelect;

const ownerShopSelect = {
  id: true,
  name: true,
  description: true,
  imageUrl: true,
  imageUrls: true,
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
  services: {
    orderBy: { createdAt: "asc" as const },
    select: ownerServiceSelect,
  },
  barberMemberships: {
    where: { status: BarberMembershipStatus.ACTIVE },
    orderBy: { createdAt: "asc" as const },
    select: {
      barber: {
        select: ownerBarberSelect,
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

  async updateShop(
    user: AuthenticatedUser,
    shopId: string,
    dto: CreateShopDto,
  ) {
    await this.getOwnedShop(user, shopId);
    const shop = await this.prisma.shop.update({
      where: { id: shopId },
      data: {
        name: dto.name,
        description: dto.description ?? null,
        imageUrl: dto.imageUrls?.[0] ?? dto.imageUrl ?? null,
        imageUrls:
          dto.imageUrls ?? (dto.imageUrl ? [dto.imageUrl] : []),
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2 ?? null,
        locality: dto.locality ?? null,
        city: dto.city,
        state: dto.state ?? null,
        postalCode: dto.postalCode,
        country: dto.country,
      },
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
              isDiscoverable: true,
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

  async updateBarber(
    user: AuthenticatedUser,
    shopId: string,
    barberId: string,
    dto: UpdateBarberDto,
  ) {
    const membership = await this.getOwnedBarber(user, shopId, barberId);

    try {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.barber.update({
          where: { id: barberId },
          data: {
            displayName: dto.displayName,
            ...(dto.bio !== undefined ? { bio: dto.bio || null } : {}),
          },
        });

        if (membership.barber.userId) {
          await transaction.user.update({
            where: { id: membership.barber.userId },
            data: {
              ...(dto.email !== undefined ? { email: dto.email } : {}),
              ...(dto.phone !== undefined ? { phone: dto.phone || null } : {}),
            },
          });
        }
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("An account with this email already exists");
      }
      throw error;
    }

    const updated = await this.getOwnedBarber(user, shopId, barberId);
    return updated.barber;
  }

  async removeBarber(
    user: AuthenticatedUser,
    shopId: string,
    barberId: string,
  ) {
    const membership = await this.getOwnedBarber(user, shopId, barberId);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.shopBarberMembership.update({
        where: { id: membership.id },
        data: {
          status: BarberMembershipStatus.REVOKED,
          respondedAt: new Date(),
        },
      });
      const activeMemberships = await transaction.shopBarberMembership.count({
        where: { barberId, status: BarberMembershipStatus.ACTIVE },
      });
      if (activeMemberships === 0) {
        await transaction.barber.update({
          where: { id: barberId },
          data: { isDiscoverable: false },
        });
      }
    });

    return { barberId, status: BarberMembershipStatus.REVOKED };
  }

  async createService(
    user: AuthenticatedUser,
    shopId: string,
    dto: CreateServiceDto,
  ) {
    await this.getOwnedShop(user, shopId);
    await this.assertUniqueServiceName(shopId, dto.name);

    const service = await this.prisma.service.create({
      data: {
        shopId,
        name: dto.name,
        description: dto.description,
        durationMin: 10,
        price: dto.price,
        isActive: true,
      },
      select: ownerServiceSelect,
    });
    return this.toOwnerService(service);
  }

  async listVisits(user: AuthenticatedUser, shopId: string) {
    await this.getOwnedShop(user, shopId);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const appointments = await this.prisma.appointment.findMany({
      where: {
        shopId,
        timeSlotId: null,
        scheduledDate: { gte: today },
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      },
      orderBy: [{ scheduledDate: "asc" }, { createdAt: "asc" }],
      select: {
        bookingGroupId: true,
        scheduledDate: true,
        status: true,
        createdAt: true,
        customer: { select: { firstName: true, lastName: true } },
        barber: { select: { id: true, displayName: true } },
        service: { select: { id: true, name: true } },
      },
    });
    const groups = new Map<string, typeof appointments>();
    appointments.forEach((appointment) => {
      const group = groups.get(appointment.bookingGroupId) ?? [];
      group.push(appointment);
      groups.set(appointment.bookingGroupId, group);
    });
    return [...groups.entries()].map(([id, items]) => ({
      id,
      visitDate: items[0].scheduledDate?.toISOString().slice(0, 10),
      status: items[0].status,
      createdAt: items[0].createdAt,
      customerName: [items[0].customer.firstName, items[0].customer.lastName]
        .filter(Boolean)
        .join(" "),
      barber: items[0].barber,
      services: items.map(({ service }) => service),
    }));
  }

  async updateService(
    user: AuthenticatedUser,
    shopId: string,
    serviceId: string,
    dto: UpdateServiceDto,
  ) {
    await this.getOwnedService(user, shopId, serviceId);
    await this.assertUniqueServiceName(shopId, dto.name, serviceId);

    const service = await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        name: dto.name,
        description: dto.description ?? null,
        price: dto.price,
        isActive: dto.isActive,
      },
      select: ownerServiceSelect,
    });
    return this.toOwnerService(service);
  }

  async deactivateService(
    user: AuthenticatedUser,
    shopId: string,
    serviceId: string,
  ) {
    await this.getOwnedService(user, shopId, serviceId);
    const service = await this.prisma.service.update({
      where: { id: serviceId },
      data: { isActive: false },
      select: ownerServiceSelect,
    });
    return this.toOwnerService(service);
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

  private async getOwnedBarber(
    user: AuthenticatedUser,
    shopId: string,
    barberId: string,
  ) {
    this.assertOwner(user);
    const membership = await this.prisma.shopBarberMembership.findFirst({
      where: {
        shopId,
        barberId,
        status: BarberMembershipStatus.ACTIVE,
        shop: { owner: { userId: user.id } },
      },
      select: {
        id: true,
        barber: {
          select: {
            ...ownerBarberSelect,
            userId: true,
          },
        },
      },
    });
    if (!membership) throw new NotFoundException("Barber not found in this shop");
    return membership;
  }

  private async getOwnedService(
    user: AuthenticatedUser,
    shopId: string,
    serviceId: string,
  ) {
    this.assertOwner(user);
    const service = await this.prisma.service.findFirst({
      where: {
        id: serviceId,
        shopId,
        shop: { owner: { userId: user.id } },
      },
      select: { id: true },
    });
    if (!service) throw new NotFoundException("Service not found in this shop");
    return service;
  }

  private async assertUniqueServiceName(
    shopId: string,
    name: string,
    exceptServiceId?: string,
  ) {
    const existing = await this.prisma.service.findFirst({
      where: {
        shopId,
        name: { equals: name, mode: "insensitive" },
        ...(exceptServiceId ? { id: { not: exceptServiceId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException("A service with this name already exists");
    }
  }

  private assertOwner(user: AuthenticatedUser) {
    if (user.role !== UserRole.SHOP_OWNER) {
      throw new ForbiddenException("A shop owner account is required");
    }
  }

  private toOwnerShop(shop: OwnerShopPayload) {
    const { barberMemberships, services, ...shopDetails } = shop;
    return {
      ...shopDetails,
      barbers: barberMemberships.map(({ barber }) => barber),
      services: services.map((service) => this.toOwnerService(service)),
    };
  }

  private toOwnerService(service: Prisma.ServiceGetPayload<{
    select: typeof ownerServiceSelect;
  }>) {
    return { ...service, price: service.price.toFixed(2) };
  }

  private shopData(dto: CreateShopDto) {
    return {
      name: dto.name,
      description: dto.description,
      imageUrl: dto.imageUrls?.[0] ?? dto.imageUrl,
      imageUrls:
        dto.imageUrls ?? (dto.imageUrl ? [dto.imageUrl] : []),
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
