import { ApiProperty } from "@nestjs/swagger";
import { Shift as PrismaShift } from "@prisma/client";

export class Shift implements PrismaShift {
  @ApiProperty({ description: "The unique identifier of the shift" })
  id: string;

  @ApiProperty({ description: "The name of the shift" })
  name: string;

  @ApiProperty({
    description: "The start time of the shift in HH:MM format",
    example: "09:00",
  })
  startTime: string;

  @ApiProperty({
    description: "The end time of the shift in HH:MM format",
    example: "17:00",
  })
  endTime: string;

  @ApiProperty({
    description: "The days of the week the shift applies to",
    example: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  })
  days: string[];

  @ApiProperty({
    description: "The color code for UI representation",
    example: "#75CAA6",
  })
  color: string;

  @ApiProperty({
    description: "Whether the shift is active",
    example: true,
  })
  active: boolean;

  @ApiProperty({
    description: "The ID of the restaurant this shift belongs to",
  })
  restaurantId: string;

  @ApiProperty({
    description: "The date and time when the shift was created",
  })
  createdAt: Date;

  @ApiProperty({
    description: "The date and time when the shift was last updated",
  })
  updatedAt: Date;
}
