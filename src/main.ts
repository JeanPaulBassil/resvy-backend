import * as bodyParser from "body-parser";
import compression from "compression";
import helmet from "helmet";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app/app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import {
  HttpException,
  HttpStatus,
  Logger,
  ValidationError,
  ValidationPipe,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpResponseInterceptor } from "./common/interceptors";
import { AllExceptionsFilter } from "./common/filters";
import { PrismaClientExceptionFilter } from "nestjs-prisma";
import { IConfig, INestConfig } from "./modules/config/config.schema";
import { killAppWithGrace, setupSwagger } from "./common/helpers/app.utils";

const logger = new Logger("Bootstrap");

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get<ConfigService<IConfig>>(ConfigService);

  // ======================================================
  // security and middlewares
  // ======================================================

  app.enable("trust proxy");
  app.set("etag", "strong");
  app.use(
    bodyParser.json({ limit: "10mb" }),
    bodyParser.urlencoded({ limit: "10mb", extended: true }),
  );
  app.use(compression());
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, "data:", "validator.swagger.io"],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
        },
      },
    }),
  );
  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  // =====================================================
  // configure global pipes, filters, interceptors
  // =====================================================

  app.setGlobalPrefix("api");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
      validateCustomDecorators: true,
      exceptionFactory: (errors: ValidationError[]) =>
        new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            errors: errors.reduce(
              (accumulator, currentValue) => ({
                ...accumulator,
                [currentValue.property]: Object.values(
                  currentValue.constraints,
                ).join(", "),
              }),
              {},
            ),
          },
          HttpStatus.BAD_REQUEST,
        ),
    }),
  );

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new PrismaClientExceptionFilter(httpAdapter, {
      P2000: HttpStatus.BAD_REQUEST,
      P2002: HttpStatus.CONFLICT,
      P2025: HttpStatus.NOT_FOUND,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new HttpResponseInterceptor());

  // =========================================================
  // configure swagger
  // =========================================================

  setupSwagger(app, configService, "1.0.0");

  app.enableShutdownHooks();
  killAppWithGrace(app);

  // Main entry point
  const port = configService.get<INestConfig>("nest").port;
  const environment = configService.get("environment");

  await app.listen(port);

  logger.log(`Application is running in ${environment} mode`);
  logger.log(`==========================================================`);
  logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
  logger.log(`==========================================================`);
  logger.log(`📊 Stats is running on:  http://localhost:${port}/stats`);
  logger.log(`==========================================================`);

  if (environment === "dev") {
    logger.log(`📑 Swagger is running on:  http://localhost:${port}/docs`);
    logger.log(`==========================================================`);
  }
}
bootstrap();
