import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";

@Injectable()
export class PositiveNumberValidationPipe implements PipeTransform {
  async transform(value: number) {
    if (value <= 0) {
      throw new BadRequestException("id should be a positive number");
    }
    return value;
  }
}
