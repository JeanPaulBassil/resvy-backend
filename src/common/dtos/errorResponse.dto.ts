import { ApiProperty } from "@nestjs/swagger";

/**
 * Dto for the error response
 */
export class ErrorResponseDto<T extends Error> {
  @ApiProperty()
  error: T;
  @ApiProperty({ example: 1617826799860 })
  timestamp: number;
}
