import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";
import { ReservationSource, ReservationStatus } from "@prisma/client";

export class CreateReservationDto {
  @ApiPropertyOptional({ description: "Table ID (optional)" })
  @IsOptional()
  @IsUUID()
  tableId?: string;

  @ApiProperty({ description: "Guest ID" })
  @IsNotEmpty()
  @IsUUID()
  guestId: string;

  @ApiProperty({ description: "Restaurant ID" })
  @IsNotEmpty()
  @IsUUID()
  restaurantId: string;

  @ApiProperty({ description: "Reservation date (YYYY-MM-DD)" })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({ description: "Start time (ISO format)" })
  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @ApiPropertyOptional({ description: "End time (optional, ISO format)" })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiProperty({ description: "Number of guests", minimum: 1 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  numberOfGuests: number;

  @ApiPropertyOptional({ description: "Optional notes about the reservation" })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: "Reservation status",
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @ApiPropertyOptional({
    description: "Reservation source",
    enum: ReservationSource,
    default: ReservationSource.PHONE,
  })
  @IsOptional()
  @IsEnum(ReservationSource)
  source?: ReservationSource;

  @ApiPropertyOptional({ description: "Shift ID (optional)" })
  @IsOptional()
  @IsUUID()
  shiftId?: string;
}
