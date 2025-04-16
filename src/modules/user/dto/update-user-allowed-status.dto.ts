import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty } from "class-validator";

export class UpdateUserAllowedStatusDto {
  @ApiProperty({
    description: "Whether the user is allowed to access the system",
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isAllowed: boolean;
}
