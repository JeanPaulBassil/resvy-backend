import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";

export class UpdateRestaurantDto {
  @ApiProperty({
    description: "The name of the restaurant",
    example: "Delicious Bites",
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: "The description of the restaurant",
    example: "A cozy restaurant serving Italian cuisine",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "The address of the restaurant",
    example: "123 Main St, City, Country",
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: "The phone number of the restaurant",
    example: "+1234567890",
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: "The email of the restaurant",
    example: "contact@deliciousbites.com",
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
