import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  Matches,
  IsOptional,
} from "class-validator";

export class CreateShiftDto {
  @ApiProperty({
    description: "The name of the shift",
    example: "Breakfast",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "The start time of the shift in HH:MM format (24-hour)",
    example: "09:00",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "startTime must be in the format HH:MM (24-hour)",
  })
  startTime: string;

  @ApiProperty({
    description: "The end time of the shift in HH:MM format (24-hour)",
    example: "17:00",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "endTime must be in the format HH:MM (24-hour)",
  })
  endTime: string;

  @ApiProperty({
    description: "The days of the week the shift applies to",
    example: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: "At least one day must be selected" })
  @IsString({ each: true })
  days: string[];

  @ApiProperty({
    description: "The color code for UI representation",
    example: "#75CAA6",
    required: false,
  })
  @IsString()
  @IsOptional()
  color?: string;
}
