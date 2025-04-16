import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

export const ApiControllerConfig = (tagName: string) => {
  return applyDecorators(ApiTags(tagName), ApiBearerAuth("authorization"));
};
