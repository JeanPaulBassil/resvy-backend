import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { FloorType } from "@prisma/client";
import { Transform } from "class-transformer";

export class CreateFloorDto {
  @ApiProperty({
    description: "The name of the floor",
    example: "Main Floor",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "The type of floor",
    enum: FloorType,
    example: FloorType.INDOOR,
  })
  @Transform(({ value }) => value?.toUpperCase())
  @IsEnum(FloorType)
  @IsNotEmpty()
  type: FloorType;

  @ApiProperty({
    description: "The color of the floor for visual distinction",
    example: "#FF5733",
    required: false,
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({
    description: "The restaurant ID",
    example: "123",
    required: false,
  })
  @IsString()
  @IsOptional()
  restaurantId?: string;
}
