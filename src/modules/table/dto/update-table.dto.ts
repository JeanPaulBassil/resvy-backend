import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsUUID,
  IsArray,
  IsBoolean,
} from "class-validator";
import { TableStatus } from "@prisma/client";

export class UpdateTableDto {
  @ApiProperty({
    description: "The name of the table",
    example: "Table 1",
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: "The seating capacity of the table",
    example: 4,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiProperty({
    description: "The X coordinate position of the table",
    example: 100,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  x?: number;

  @ApiProperty({
    description: "The Y coordinate position of the table",
    example: 100,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  y?: number;

  @ApiProperty({
    description: "The status of the table",
    enum: TableStatus,
    example: TableStatus.AVAILABLE,
    required: false,
  })
  @IsEnum(TableStatus)
  @IsOptional()
  status?: TableStatus;

  @ApiProperty({
    description: "The color of the table",
    example: "#75CAA6",
    required: false,
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({
    description: "The ID of the floor this table is on",
    required: false,
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  floorId?: string;

  @ApiProperty({
    description: "IDs of tables that are merged into this table",
    type: [String],
    required: false,
  })
  @IsArray()
  @IsOptional()
  mergedTableIds?: string[];

  @ApiProperty({
    description:
      "ID of the parent table if this table is part of a merged table",
    required: false,
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  parentTableId?: string;

  @ApiProperty({
    description:
      "Whether the table is hidden (e.g. when part of a merged table)",
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isHidden?: boolean;

  @ApiProperty({
    description: "Whether this table is a merged table",
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isMerged?: boolean;
}
