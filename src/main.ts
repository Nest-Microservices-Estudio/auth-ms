import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config/envs';

async function bootstrap() {
  const logger = new Logger('Auth-Ms');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      //  TODO: CAMBIANDO A NATS

      transport: Transport.NATS,

      options: {
   
        servers: envs.natsServers,
      },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen();
  logger.log(`AUTH MS is running on: ${envs.port}`);
}
bootstrap();
