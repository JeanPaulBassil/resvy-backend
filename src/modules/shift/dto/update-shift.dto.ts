import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsArray,
  ArrayMinSize,
  Matches,
  IsBoolean,
} from "class-validator";

export class UpdateShiftDto {
  @ApiProperty({
    description: "The name of the shift",
    example: "Breakfast",
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: "The start time of the shift in HH:MM format (24-hour)",
    example: "09:00",
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "startTime must be in the format HH:MM (24-hour)",
  })
  startTime?: string;

  @ApiProperty({
    description: "The end time of the shift in HH:MM format (24-hour)",
    example: "17:00",
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "endTime must be in the format HH:MM (24-hour)",
  })
  endTime?: string;

  @ApiProperty({
    description: "The days of the week the shift applies to",
    example: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ArrayMinSize(1, { message: "At least one day must be selected" })
  @IsString({ each: true })
  days?: string[];

  @ApiProperty({
    description: "The color code for UI representation",
    example: "#75CAA6",
    required: false,
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({
    description: "Whether the shift is active",
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
