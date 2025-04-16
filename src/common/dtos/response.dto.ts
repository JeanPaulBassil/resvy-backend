import { ApiProperty } from "@nestjs/swagger";

/**
 * Dto for the response
 */
export class ResponseDto<T> {
  @ApiProperty()
  payload: T;
}
