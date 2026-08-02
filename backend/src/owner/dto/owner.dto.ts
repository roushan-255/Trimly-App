import { Transform } from "class-transformer";
import {
  IsEmail,
  IsOptional,
  IsString,
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

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

const normalizePhone = ({ value }: { value: unknown }) => {
  const normalized = optionalTrim({ value });
  return typeof normalized === "string"
    ? normalized.replace(/[\s()-]/g, "")
    : normalized;
};

export class CreateShopDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  description?: string;

  @Transform(normalizePhone)
  @IsOptional()
  @Matches(/^\+?[1-9]\d{7,14}$/)
  phone?: string;

  @Transform(normalizeEmail)
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  addressLine1!: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city!: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  postalCode!: string;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  country!: string;
}

export class CreateBarberDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  displayName!: string;

  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @Transform(normalizePhone)
  @IsOptional()
  @Matches(/^\+?[1-9]\d{7,14}$/)
  phone?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  bio?: string;
}

