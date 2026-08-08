import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const optionalTrim = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === "") return undefined;
  return typeof value === "string" ? value.trim() : value;
};

const stringArray = ({ value }: { value: unknown }) => {
  const values = Array.isArray(value) ? value : [value];
  return values
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

const booleanValue = ({ value }: { value: unknown }) => {
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return value;
};

export enum ShopSort {
  RATING = "rating",
  NEWEST = "newest",
  PRICE_LOW = "price_low",
  PRICE_HIGH = "price_high",
}

export class ShopSearchDto {
  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @Transform(optionalTrim)
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @Transform(stringArray)
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  service?: string[];

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000)
  minPrice?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000)
  maxPrice?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Max(5)
  minRating?: number;

  @Transform(booleanValue)
  @IsOptional()
  @IsBoolean()
  verifiedOnly?: boolean;

  @IsEnum(ShopSort)
  @IsOptional()
  sort: ShopSort = ShopSort.RATING;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 12;
}

export class LocationSuggestionDto {
  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  query?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit = 8;
}

export class ServiceOptionsDto {
  @Transform(optionalTrim)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;
}
