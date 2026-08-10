import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class RescheduleBookingDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsUUID(undefined, { each: true })
  slotIds!: string[];
}

export class SubmitBookingReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  shopRating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  shopComment?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  barberRating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  barberComment?: string;
}
