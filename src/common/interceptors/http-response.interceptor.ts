import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { IGNORE_HTTP_RESPONSE_INTERCEPTOR_META } from "../constants";
import { ResponseDto } from "../dtos";

@Injectable()
export class HttpResponseInterceptor<T> implements NestInterceptor<T> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseDto<T>> {
    const isIgnored = Reflect.getMetadata(
      IGNORE_HTTP_RESPONSE_INTERCEPTOR_META,
      context.getHandler(),
    );

    if (isIgnored) {
      return next.handle();
    }

    return next.handle().pipe(
      map((payload) => {
        return { payload };
      }),
    );
  }
}
