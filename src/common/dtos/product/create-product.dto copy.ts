import { IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  @ApiProperty()
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  description?: string;

  @IsOptional()
  @ApiProperty()
  images?: string[];

  @IsString()
  @IsOptional()
  @ApiProperty()
  categoryId?: string;

  @IsOptional()
  @ApiProperty()
  tags?: string[];

  @IsString()
  @IsOptional()
  @ApiProperty()
  brandId?: string;
}
