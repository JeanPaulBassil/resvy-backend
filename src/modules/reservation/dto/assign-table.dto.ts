import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsUUID } from "class-validator";

export class AssignTableDto {
  @ApiProperty({ description: "Table ID to assign" })
  @IsNotEmpty()
  @IsUUID()
  tableId: string;

  @ApiPropertyOptional({
    description: "Additional notes about table assignment",
  })
  @IsOptional()
  notes?: string;
}
