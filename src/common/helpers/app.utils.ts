import type { INestApplication } from "@nestjs/common";
import { Logger } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { IConfig, IDocsConfig } from "src/modules/config";
import { IS_PUBLIC_KEY_META } from "../constants";
import { getMiddleware } from "swagger-stats";
import { isArray } from "./functions.utils";

const logger = new Logger("App:Utils");

export async function gracefulShutdown(app: INestApplication, code: string) {
  setTimeout(() => process.exit(1), 5000);
  logger.verbose(`Signal received with code ${code} ⚡.`);
  logger.log("❗Closing http server with grace.");

  try {
    await app.close();
    logger.log("✅ Http server closed.");
    process.exit(0);
  } catch (error: any) {
    logger.error(`❌ Http server closed with error: ${error}`);
    process.exit(1);
  }
}

export async function killAppWithGrace(app: INestApplication) {
  process.on("SIGINT", async () => {
    await gracefulShutdown(app, "SIGINT");
  });

  process.on("SIGTERM", async () => {
    await gracefulShutdown(app, "SIGTERM");
  });

  process.on("unhandledRejection", async (reason, promise) => {
    logger.error(`❌ Unhandled Rejection at: ${promise} reason: ${reason} ⚠️`);
    await gracefulShutdown(app, "unhandledRejection");
  });

  process.on("uncaughtException", async (error) => {
    logger.error(`❌ Uncaught Exception thrown: ${error} ⚠️`);
    await gracefulShutdown(app, "uncaughtException");
  });

  process.on("exit", (code) => {
    logger.log(`⚡ Process exited with code: ${code}`);
  });
}

export async function setupSwagger(
  app: INestApplication,
  configService: ConfigService<IConfig>,
  apiVersion: string,
) {
  const userName = configService.get<IDocsConfig>("docs").username;
  const passWord = configService.get<IDocsConfig>("docs").password;

  const options = new DocumentBuilder()
    .setTitle("My Wallet Manager Backend API")
    .setDescription(
      "This api is used by the My Wallet Manager frontend app to provide communication link between the frontend and the database",
    )
    .setVersion(apiVersion)
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "authorization",
    )
    .build();

  const document = SwaggerModule.createDocument(app, options, {});

  const paths = Object.values(document.paths);

  for (const path of paths) {
    const methods = Object.values(path) as { security: string[] }[];

    for (const method of methods) {
      if (
        isArray(method.security) &&
        method.security.includes(IS_PUBLIC_KEY_META)
      )
        method.security = [];
    }
  }

  app.use(
    getMiddleware({
      swaggerSpec: document,
      authentication: true,
      hostname: "localhost",
      uriPath: "/stats",
      onAuthenticate: (_request: any, username: string, password: string) => {
        return username === userName && password === passWord;
      },
    }),
  );

  if (configService.get("environment") === "prod") return;

  SwaggerModule.setup("/docs", app, document, {
    explorer: true,
    customSiteTitle: "My Wallet Manager Backend API",
    customCss: ".swagger-ui .topbar { display: none }",
    swaggerOptions: {
      docExpansion: "list",
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
      displayOperationId: true,
      persistAuthorization: true,
      operationsSorter: (
        a: { get: (argument: string) => string },
        b: { get: (argument: string) => string },
      ) => {
        const methodsOrder = [
          "get",
          "post",
          "put",
          "patch",
          "delete",
          "options",
          "trace",
        ];
        let result =
          methodsOrder.indexOf(a.get("method")) -
          methodsOrder.indexOf(b.get("method"));

        if (result === 0) result = a.get("path").localeCompare(b.get("path"));

        return result;
      },
    },
  });
}
