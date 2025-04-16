import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateAllowedEmailDto {
  @ApiProperty({
    description: "The email address to allow",
    example: "user@example.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "Optional description for this allowed email",
    example: "Marketing team member",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: "ID of the admin who created this entry",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsString()
  @IsOptional()
  createdBy?: string;
}
