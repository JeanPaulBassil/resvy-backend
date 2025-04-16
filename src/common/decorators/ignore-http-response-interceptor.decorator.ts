import { SetMetadata } from "@nestjs/common";
import { IGNORE_HTTP_RESPONSE_INTERCEPTOR_META } from "../constants";

export const IgnoreHttpResponseInterceptor = () =>
  SetMetadata(IGNORE_HTTP_RESPONSE_INTERCEPTOR_META, true);
