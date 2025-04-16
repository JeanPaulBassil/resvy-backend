import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  ArrayMinSize,
} from "class-validator";

export class MergeTablesDto {
  @ApiProperty({
    description: "Array of table IDs to merge",
    type: [String],
    example: ["table-id-1", "table-id-2"],
  })
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  @IsUUID(undefined, { each: true })
  @IsNotEmpty()
  tableIds: string[];
}
