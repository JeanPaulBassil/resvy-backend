import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateGuestDto {
  @ApiProperty({ description: "Guest name" })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: "Guest email" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: "Guest phone number" })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional({ description: "Guest tags/categories", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: "Notes about the guest" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: "Preferred seating (window, booth, etc.)",
  })
  @IsOptional()
  @IsString()
  preferredSeating?: string;

  @ApiPropertyOptional({ description: "Dining preferences", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  diningPreferences?: string[];

  @ApiPropertyOptional({ description: "Dietary restrictions", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryRestrictions?: string[];

  @ApiPropertyOptional({ description: "Allergies information" })
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiPropertyOptional({ description: "Whether the guest is a VIP" })
  @IsOptional()
  @IsBoolean()
  isVip?: boolean;
}
