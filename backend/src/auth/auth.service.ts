import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { UserRole } from "../generated/prisma/enums";
import { PrismaService } from "../prisma/prisma.service";
import { AccessTokenService } from "./access-token.service";
import {
  AdminSignupDto,
  BarberSignupDto,
  CustomerSignupDto,
  LoginDto,
  ShopOwnerSignupDto,
  SignupCredentialsDto,
} from "./dto/auth.dto";
import { PasswordService } from "./password.service";

const publicUserSelect = {
  id: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

type ProfileCreateData = Pick<
  Prisma.UserCreateInput,
  "customerProfile" | "ownerProfile" | "barberProfile" | "adminProfile"
>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly accessTokens: AccessTokenService,
  ) {}

  signupCustomer(dto: CustomerSignupDto) {
    return this.createUser(dto, UserRole.CUSTOMER, {
      customerProfile: {
        create: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          avatar: dto.avatar,
        },
      },
    });
  }

  signupShopOwner(dto: ShopOwnerSignupDto) {
    return this.createUser(dto, UserRole.SHOP_OWNER, {
      ownerProfile: {
        create: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          avatarUrl: dto.avatarUrl,
          businessLegalName: dto.businessLegalName,
          gstin: dto.gstin,
          panNumber: dto.panNumber,
        },
      },
    });
  }

  async signupBarber(dto: BarberSignupDto) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: dto.shopId },
      select: { id: true },
    });

    if (!shop) {
      throw new NotFoundException("Shop not found");
    }

    return this.createUser(dto, UserRole.BARBER, {
      barberProfile: {
        create: {
          displayName: dto.displayName,
          bio: dto.bio,
          shop: { connect: { id: shop.id } },
        },
      },
    });
  }

  signupAdmin(dto: AdminSignupDto) {
    return this.createUser(dto, UserRole.ADMIN, {
      adminProfile: {
        create: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          avatarUrl: dto.avatarUrl,
          designation: dto.designation,
          department: dto.department,
        },
      },
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (
      !user ||
      !(await this.passwords.verify(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return {
      ...this.accessTokens.issue(user),
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  private async createUser(
    credentials: SignupCredentialsDto,
    role: UserRole,
    profile: ProfileCreateData,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: credentials.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException("An account with this email already exists");
    }

    const passwordHash = await this.passwords.hash(credentials.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: credentials.email,
          phone: credentials.phone,
          passwordHash,
          role,
          ...profile,
        },
        select: publicUserSelect,
      });

      return { user };
    } catch (error: unknown) {
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
