import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
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

const normalizeOptionalEmail = ({ value }: { value: unknown }) => {
  const normalized = optionalTrim({ value });
  return typeof normalized === "string" ? normalized.toLowerCase() : normalized;
};

const normalizePhone = ({ value }: { value: unknown }) => {
  const normalized = optionalTrim({ value });
  return typeof normalized === "string"
    ? normalized.replace(/[\s()-]/g, "")
    : normalized;
};

const nullableTrim = ({ value }: { value: unknown }) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return typeof value === "string" ? value.trim() || null : value;
};

const normalizeNullablePhone = ({ value }: { value: unknown }) => {
  const normalized = nullableTrim({ value });
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

  @Transform(optionalTrim)
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2_048)
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({ require_protocol: true }, { each: true })
  imageUrls?: string[];

  @Transform(normalizePhone)
  @IsOptional()
  @Matches(/^\+?[1-9]\d{7,14}$/)
  phone?: string;

  @Transform(normalizeOptionalEmail)
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

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  locality?: string;

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

export class UpdateBarberDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  displayName!: string;

  @Transform(normalizeEmail)
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @Transform(normalizeNullablePhone)
  @IsOptional()
  @Matches(/^\+?[1-9]\d{7,14}$/)
  phone?: string | null;

  @Transform(nullableTrim)
  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  bio?: string | null;
}

export class CreateServiceDto {
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

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;
}

export class UpdateServiceDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @Transform(nullableTrim)
  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  description?: string | null;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsBoolean()
  isActive!: boolean;
}
