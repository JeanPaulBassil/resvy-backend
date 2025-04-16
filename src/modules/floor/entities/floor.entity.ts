import { ApiProperty } from "@nestjs/swagger";
import { Floor as PrismaFloor, FloorType } from "@prisma/client";

export class Floor implements PrismaFloor {
  @ApiProperty({ description: "The unique identifier of the floor" })
  id: string;

  @ApiProperty({ description: "The name of the floor" })
  name: string;

  @ApiProperty({
    description: "The type of floor",
    enum: FloorType,
    example: FloorType.INDOOR,
  })
  type: FloorType;

  @ApiProperty({
    description: "The ID of the restaurant this floor belongs to",
  })
  restaurantId: string;

  @ApiProperty({
    description: "The color of the floor",
    example: "#000000",
  })
  color: string;

  @ApiProperty({ description: "The date and time when the floor was created" })
  createdAt: Date;

  @ApiProperty({
    description: "The date and time when the floor was last updated",
  })
  updatedAt: Date;
}
