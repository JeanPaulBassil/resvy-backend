import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty } from "class-validator";

export class ToggleShiftActiveDto {
  @ApiProperty({
    description: "Whether the shift is active",
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  active: boolean;
}
