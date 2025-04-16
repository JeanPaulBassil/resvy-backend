import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateRestaurantDto {
  @ApiProperty({
    description: "The name of the restaurant",
    example: "Delicious Bites",
  })
  @IsNotEmpty()
  @IsString()
  name: string;

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
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    description: "The phone number of the restaurant",
    example: "+1234567890",
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    description: "The email of the restaurant",
    example: "contact@deliciousbites.com",
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
