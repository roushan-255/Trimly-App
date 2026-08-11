import {
  ArrayMaxSize,
  ArrayMinSize,
  IsDateString,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class CreateBookingDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsUUID(undefined, { each: true })
  serviceIds!: string[];

  @IsDateString({ strict: true })
  date!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
