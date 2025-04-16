import * as Joi from "joi";

export enum Environment {
  DEV = "dev",
  PROD = "prod",
  TEST = "test",
}

export interface IDatabaseConfig {
  user: string;
  password: string;
  db: string;
  host: string;
  port: number;
}

export interface IDocsConfig {
  username: string;
  password: string;
}
export interface IThrottleConfig {
  ttl: number;
  limit: number;
}

export interface IS3Config {
  provider: string;
  bucketName: string;
  stackheroMinioHost: string;
  minioConsolePort: number;
  minioApiPort: number;
  stackheroMinioAccessKey: string;
  stackheroMinioSecretKey: string;
}

export interface INestConfig {
  appUrl: string;
  port: number;
  jwt: {
    accessSecret: string;
    accessExpiration: string;
    refreshSecret: string;
    refreshExpiration: string;
  };
}

export interface IConfig {
  database: IDatabaseConfig;
  nest: INestConfig;
  docs: IDocsConfig;
  throttle: IThrottleConfig;
  environment: Environment;
  s3: IS3Config;
  sms: ISMSConfig;
}

export interface ISMSConfig {
  apiBaseUrl: string;
  username: string;
  password: string;
  sender: string;
}

const configSchema = Joi.object({
  database: Joi.object({
    user: Joi.string().required(),
    password: Joi.string().required().allow(""),
    db: Joi.string().required(),
    port: Joi.number().default(5432),
    host: Joi.string().default("localhost"),
  }).required(),

  s3: {
    provider: Joi.string().required().default(process.env.S3_PROVIDER),
    bucketName: Joi.string().required().default(process.env.S3_BUCKET_NAME),
    stackheroMinioHost: Joi.string()
      .required()
      .default(process.env.STACKHERO_MINIO_HOST),
    minioConsolePort: Joi.number()
      .required()
      .default(Number(process.env.MINIO_CONSOLE_PORT)),
    minioApiPort: Joi.number()
      .required()
      .default(Number(process.env.MINIO_API_PORT)),
    stackheroMinioAccessKey: Joi.string()
      .required()
      .default(process.env.STACKHERO_MINIO_ACCESS_KEY),
    stackheroMinioSecretKey: Joi.string()
      .required()
      .default(process.env.STACKHERO_MINIO_SECRET_KEY),
  },

  nest: Joi.object({
    appUrl: Joi.string().required().default("http://localhost:3000"),
    port: Joi.number().default(5200),
    jwt: Joi.object({
      accessSecret: Joi.string().required(),
      accessExpiration: Joi.string().required(),
      refreshSecret: Joi.string().required(),
      refreshExpiration: Joi.string().required(),
    }).required(),
  }).required(),

  docs: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }).required(),

  throttle: Joi.object({
    ttl: Joi.number().default(60),
    limit: Joi.number().default(10),
  }).required(),

  environment: Joi.string()
    .valid(Environment.DEV, Environment.PROD, Environment.TEST)
    .required(),

  sms: Joi.object({
    apiBaseUrl: Joi.string().required(),
    username: Joi.string().required(),
    password: Joi.string().required(),
    sender: Joi.string().required(),
  }).required(),
});

export interface ISMSConfig {
  apiBaseUrl: string;
  username: string;
  password: string;
  sender: string;
}

function transformConfig(config: Record<string, any>): IConfig {
  return {
    database: {
      user: config.POSTGRES_USER,
      password: config.POSTGRES_PASSWORD,
      db: config.POSTGRES_DB,
      port: Number(config.POSTGRES_PORT),
      host: config.POSTGRES_HOST,
    },
    s3: {
      provider: config.S3_PROVIDER,
      bucketName: config.S3_BUCKET_NAME,
      stackheroMinioHost: config.STACKHERO_MINIO_HOST,
      minioConsolePort: config.MINIO_CONSOLE_PORT,
      minioApiPort: config.MINIO_API_PORT,
      stackheroMinioAccessKey: config.STACKHERO_MINIO_ACCESS_KEY,
      stackheroMinioSecretKey: config.STACKHERO_MINIO_SECRET_KEY,
    },
    nest: {
      appUrl: config.APP_URL,
      port: Number(config.NESTJS_PORT),
      jwt: {
        accessSecret: config.JWT_ACCESS_SECRET,
        accessExpiration: config.JWT_ACCESS_EXPIRATION,
        refreshSecret: config.JWT_REFRESH_SECRET,
        refreshExpiration: config.JWT_REFRESH_EXPIRATION,
      },
    },
    docs: {
      username: config.DOCS_USERNAME,
      password: config.DOCS_PASSWORD,
    },
    throttle: {
      ttl: Number(config.THROTTLE_TTL),
      limit: Number(config.THROTTLE_LIMIT),
    },
    environment: config.NODE_ENV as Environment,
    sms: {
      apiBaseUrl: config.SMS_API_BASE_URL,
      username: config.SMS_API_USERNAME,
      password: config.SMS_API_PASSWORD,
      sender: config.SMS_API_SENDER,
    },
  };
}

/**
 * Custom function to validate environment variables. It takes an object containing environment variables as input and outputs validated environment variables.
 *
 * @param {Record<string, any>} config - Description of the parameter.
 * @returns {Record<string, any>} Description of the return value.
 * @throws {Error} Description of the exception.
 */
export function validateConfig(config: Record<string, any>) {
  const transformedConfig = transformConfig(config);

  const { error, value } = configSchema.validate(transformedConfig, {
    allowUnknown: false,
    cache: true,
    convert: true,
  });
  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  return value;
}
