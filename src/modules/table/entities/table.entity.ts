import { ApiProperty } from "@nestjs/swagger";
import { Table as PrismaTable, TableStatus } from "@prisma/client";

export class Table implements PrismaTable {
  @ApiProperty({ description: "The unique identifier of the table" })
  id: string;

  @ApiProperty({ description: "The name of the table" })
  name: string;

  @ApiProperty({ description: "The seating capacity of the table" })
  capacity: number;

  @ApiProperty({ description: "The X coordinate position of the table" })
  x: number;

  @ApiProperty({ description: "The Y coordinate position of the table" })
  y: number;

  @ApiProperty({
    description: "The status of the table",
    enum: TableStatus,
    example: TableStatus.AVAILABLE,
  })
  status: TableStatus;

  @ApiProperty({
    description: "The color of the table",
    example: "#75CAA6",
    required: false,
  })
  color: string | null;

  @ApiProperty({
    description: "The ID of the restaurant this table belongs to",
  })
  restaurantId: string;

  @ApiProperty({
    description: "The ID of the floor this table is on",
    required: false,
  })
  floorId: string | null;

  @ApiProperty({
    description: "IDs of tables that are merged into this table",
    type: [String],
    required: false,
  })
  mergedTableIds: string[];

  @ApiProperty({
    description:
      "ID of the parent table if this table is part of a merged table",
    required: false,
  })
  parentTableId: string | null;

  @ApiProperty({
    description:
      "Whether the table is hidden (e.g. when part of a merged table)",
    required: false,
  })
  isHidden: boolean;

  @ApiProperty({
    description: "Whether this table is a merged table",
    required: false,
  })
  isMerged: boolean;

  @ApiProperty({ description: "The date and time when the table was created" })
  createdAt: Date;

  @ApiProperty({
    description: "The date and time when the table was last updated",
  })
  updatedAt: Date;
}
