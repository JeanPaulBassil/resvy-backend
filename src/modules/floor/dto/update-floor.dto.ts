import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { FloorType } from "@prisma/client";

export class UpdateFloorDto {
  @ApiProperty({
    description: "The name of the floor",
    example: "Main Floor",
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: "The type of floor",
    enum: FloorType,
    example: FloorType.INDOOR,
    required: false,
  })
  @IsEnum(FloorType)
  @IsOptional()
  type?: FloorType;

  @ApiProperty({
    description: "The color of the floor for visual distinction",
    example: "#FF5733",
    required: false,
  })
  @IsString()
  @IsOptional()
  color?: string;
}
