import { Transform } from "class-transformer";
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

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

export class LoginDto {
  @Transform(trim)
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class SignupCredentialsDto extends LoginDto {
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
}

export class BarberSignupDto extends SignupCredentialsDto {
  @Transform(trim)
  @IsUUID()
  shopId!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  displayName!: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  bio?: string;
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
