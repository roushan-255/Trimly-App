import { Transform, Type } from "class-transformer";
import {
  IsEmail,
  IsDefined,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { UserRole } from "../../generated/prisma/enums";
import { CreateShopDto } from "../../owner/dto/owner.dto";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

const optionalTrim = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === "") return undefined;
  return typeof value === "string" ? value.trim() : value;
};

const normalizePhone = ({ value }: { value: unknown }) => {
  const trimmed = optionalTrim({ value });
  return typeof trimmed === "string" ? trimmed.replace(/[\s()-]/g, "") : trimmed;
};

const uppercaseOptional = ({ value }: { value: unknown }) => {
  const trimmed = optionalTrim({ value });
  return typeof trimmed === "string" ? trimmed.toUpperCase() : trimmed;
};

class CredentialsDto {
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class LoginDto extends CredentialsDto {
  @IsEnum(UserRole)
  role!: UserRole;
}

export class SignupCredentialsDto extends CredentialsDto {
  @Transform(normalizePhone)
  @IsOptional()
  @Matches(/^\+?[1-9]\d{7,14}$/)
  phone?: string;

}

class BaseSignupDto extends SignupCredentialsDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName!: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;
}

export class CustomerSignupDto extends BaseSignupDto {
  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(2_048)
  avatar?: string;
}

export class ShopOwnerSignupDto extends BaseSignupDto {
  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(2_048)
  avatarUrl?: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  businessLegalName?: string;

  @Transform(uppercaseOptional)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  gstin?: string;

  @Transform(uppercaseOptional)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  panNumber?: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => CreateShopDto)
  shop!: CreateShopDto;
}

export class AdminSignupDto extends BaseSignupDto {
  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(2_048)
  avatarUrl?: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  designation?: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  department?: string;
}
