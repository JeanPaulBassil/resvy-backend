import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ErrorResponseDto } from "../dtos/errorResponse.dto";
import { HttpException } from "@nestjs/common";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  /**
   * All Exceptions Filter
   * @param exception {Error}
   * @param host {ArgumentsHost}
   * @returns {void}
   */
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(
      `\nRequest: ${request.method} ${request.url} 
      \nIP: ${request.ip}
      \nStatus: ${status}
      \nHost: ${request.headers.host}
      `,
      exception.stack,
      "AllExceptionsFilter",
    );

    response.status(status).json({
      error: exception,
      timestamp: new Date().getTime(),
    } as ErrorResponseDto<Error>);
  }
}
