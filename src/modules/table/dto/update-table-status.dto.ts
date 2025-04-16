import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";
import { TableStatus } from "@prisma/client";

export class UpdateTableStatusDto {
  @ApiProperty({
    description: "The status of the table",
    enum: TableStatus,
    example: TableStatus.AVAILABLE,
  })
  @IsEnum(TableStatus)
  @IsNotEmpty()
  status: TableStatus;
}
