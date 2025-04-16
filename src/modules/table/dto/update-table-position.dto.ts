import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsNotEmpty } from "class-validator";

export class UpdateTablePositionDto {
  @ApiProperty({
    description: "The X coordinate position of the table",
    example: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  x: number;

  @ApiProperty({
    description: "The Y coordinate position of the table",
    example: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  y: number;
}
