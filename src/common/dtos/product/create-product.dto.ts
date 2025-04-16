import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  description: string;

  @IsArray()
  @IsOptional()
  @ApiProperty()
  images: string[];

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  categoryId: string;

  @IsArray()
  @IsOptional()
  @ApiProperty()
  tags: string[];

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  brandId: string;
}
