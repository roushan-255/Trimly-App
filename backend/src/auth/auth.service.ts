import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { UserRole } from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import { AccessTokenService } from "./access-token.service";
import {
  AdminSignupDto,
  CustomerSignupDto,
  LoginDto,
  ShopOwnerSignupDto,
} from "./dto/auth.dto";
import { PasswordService } from "./password.service";

const publicUserSelect = {
  id: true,
  email: true,
  phone: true,
  roles: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const existingUserSelect = {
  id: true,
  phone: true,
  roles: true,
  customerProfile: { select: { id: true } },
  ownerProfile: { select: { id: true } },
  adminProfile: { select: { id: true } },
} satisfies Prisma.UserSelect;

type ExistingUser = Prisma.UserGetPayload<{
  select: typeof existingUserSelect;
}>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly accessTokens: AccessTokenService,
  ) {}

  async signupCustomer(dto: CustomerSignupDto) {
    return this.handleSignup(async () => {
      const existing = await this.findExistingAccount(dto.email);
      const customerProfile = {
        create: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          avatar: dto.avatar,
        },
      };

      if (existing) {
        if (existing.customerProfile) {
          throw new ConflictException("This account is already a customer");
        }

        const passwordHash = await this.passwords.hash(dto.password);

        return this.prisma.user.update({
          where: { id: existing.id },
          data: {
            phone: existing.phone ?? dto.phone,
            roles: this.mergeRoles(existing.roles, UserRole.CUSTOMER),
            roleCredentials: {
              create: { role: UserRole.CUSTOMER, passwordHash },
            },
            customerProfile,
          },
          select: publicUserSelect,
        });
      }

      const passwordHash = await this.passwords.hash(dto.password);
      return this.prisma.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          roles: [UserRole.CUSTOMER],
          roleCredentials: {
            create: { role: UserRole.CUSTOMER, passwordHash },
          },
          customerProfile,
        },
        select: publicUserSelect,
      });
    });
  }

  async signupShopOwner(dto: ShopOwnerSignupDto) {
    return this.handleSignup(async () => {
      const existing = await this.findExistingAccount(dto.email);
      const ownerProfile = {
        create: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          avatarUrl: dto.avatarUrl,
          businessLegalName: dto.businessLegalName,
          gstin: dto.gstin,
          panNumber: dto.panNumber,
          shops: { create: dto.shop },
        },
      };
      if (existing) {
        if (existing.ownerProfile) {
          throw new ConflictException("This account is already a shop owner");
        }

        const passwordHash = await this.passwords.hash(dto.password);

        return this.prisma.user.update({
          where: { id: existing.id },
          data: {
            phone: existing.phone ?? dto.phone,
            roles: this.mergeRoles(existing.roles, UserRole.SHOP_OWNER),
            roleCredentials: {
              create: { role: UserRole.SHOP_OWNER, passwordHash },
            },
            ownerProfile,
          },
          select: publicUserSelect,
        });
      }

      const passwordHash = await this.passwords.hash(dto.password);
      return this.prisma.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          roles: [UserRole.SHOP_OWNER],
          roleCredentials: {
            create: { role: UserRole.SHOP_OWNER, passwordHash },
          },
          ownerProfile,
        },
        select: publicUserSelect,
      });
    });
  }

  async signupAdmin(dto: AdminSignupDto) {
    return this.handleSignup(async () => {
      const existing = await this.findExistingAccount(dto.email);
      const adminProfile = {
        create: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          avatarUrl: dto.avatarUrl,
          designation: dto.designation,
          department: dto.department,
        },
      };

      if (existing) {
        if (existing.adminProfile) {
          throw new ConflictException("This account is already an admin");
        }

        const passwordHash = await this.passwords.hash(dto.password);

        return this.prisma.user.update({
          where: { id: existing.id },
          data: {
            phone: existing.phone ?? dto.phone,
            roles: this.mergeRoles(existing.roles, UserRole.ADMIN),
            roleCredentials: {
              create: { role: UserRole.ADMIN, passwordHash },
            },
            adminProfile,
          },
          select: publicUserSelect,
        });
      }

      const passwordHash = await this.passwords.hash(dto.password);
      return this.prisma.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          roles: [UserRole.ADMIN],
          roleCredentials: {
            create: { role: UserRole.ADMIN, passwordHash },
          },
          adminProfile,
        },
        select: publicUserSelect,
      });
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        roleCredentials: {
          select: { role: true, passwordHash: true },
        },
      },
    });
    const credential = user?.roleCredentials.find(
      ({ role }) => role === dto.role,
    );

    if (
      !user ||
      (credential &&
        !(await this.passwords.verify(dto.password, credential.passwordHash)))
    ) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (!credential) {
      const ownsAccount = await this.matchesAnyCredential(
        user.roleCredentials,
        dto.password,
      );

      if (!ownsAccount) {
        throw new UnauthorizedException("Invalid email or password");
      }

      throw new UnauthorizedException(
        dto.role === UserRole.CUSTOMER
          ? "This account is not registered as a customer"
          : dto.role === UserRole.SHOP_OWNER
            ? "This account is not registered as a shop owner"
            : "This account does not have access to the selected portal",
      );
    }

    return {
      ...this.accessTokens.issue({ id: user.id, role: dto.role }),
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: dto.role,
        roles: user.roles,
      },
    };
  }

  private findExistingAccount(email: string): Promise<ExistingUser | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: existingUserSelect,
    });
  }

  private async matchesAnyCredential(
    credentials: { passwordHash: string }[],
    password: string,
  ) {
    const matches = await Promise.all(
      credentials.map(({ passwordHash }) =>
        this.passwords.verify(password, passwordHash),
      ),
    );
    return matches.some(Boolean);
  }

  private mergeRoles(current: UserRole[], ...additional: UserRole[]) {
    return [...new Set([...current, ...additional])];
  }

  private async handleSignup<T>(operation: () => Promise<T>) {
    try {
      return { user: await operation() };
    } catch (error: unknown) {
      if (
        error instanceof ConflictException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException(
          "An account with the supplied unique details already exists",
        );
      }

      throw error;
    }
  }
}
