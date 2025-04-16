import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsArray,
  IsUUID,
} from "class-validator";
import { TableStatus } from "@prisma/client";

export class CreateTableDto {
  @ApiProperty({
    description: "The name of the table",
    example: "Table 1",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "The seating capacity of the table",
    example: 4,
  })
  @IsNumber()
  @Min(1)
  capacity: number;

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
}
