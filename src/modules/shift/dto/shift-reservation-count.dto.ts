import { ApiProperty } from "@nestjs/swagger";

export class ShiftReservationCountDto {
  @ApiProperty({
    description: "The ID of the shift",
    example: "clj8s3g0n000008l12345",
  })
  shiftId: string;

  @ApiProperty({
    description: "The date for which the count is calculated",
    example: "2023-07-15",
  })
  date: string;

  @ApiProperty({
    description: "The count of reservations for this shift on this date",
    example: 12,
  })
  count: number;

  @ApiProperty({
    description: "The total number of guests for this shift on this date",
    example: 48,
  })
  guestCount: number;
}
