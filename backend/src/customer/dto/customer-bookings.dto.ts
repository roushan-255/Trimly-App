import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class RescheduleBookingDto {
  @IsDateString({ strict: true })
  date!: string;
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
