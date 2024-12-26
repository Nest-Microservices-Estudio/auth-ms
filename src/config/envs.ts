import 'dotenv/config';
import * as joi from 'joi';
interface EnvVars {
  PORT: number;
  AUTH_DATABASE_URL: string;
  NATS_SERVERS: string[];
  JWT_SECRET: string;
}
const envsSchema: joi.ObjectSchema = joi
  .object({
    PORT: joi.number().required(),
    AUTH_DATABASE_URL: joi.string().required(),
    JWT_SECRET: joi.string().required(),
    NATS_SERVERS: joi.array().items(joi.string()).required()
  })
  .unknown(true);

const { error, value } = envsSchema.validate({
  ...process.env,
  NATS_SERVERS: process.env.NATS_SERVERS?.split(','),
});
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}
const envVars: EnvVars = value;
export const envs = {
  port: envVars.PORT,
  databaseURL: envVars.AUTH_DATABASE_URL,
  natsServers: envVars.NATS_SERVERS,
  jwtSecret: envVars.JWT_SECRET,
};
