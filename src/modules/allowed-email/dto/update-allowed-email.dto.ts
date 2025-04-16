import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";

export class UpdateAllowedEmailDto {
  @ApiProperty({
    description: "The email address to allow",
    example: "user@example.com",
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: "Optional description for this allowed email",
    example: "Marketing team member",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
