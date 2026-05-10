import { resolve } from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: resolve(__dirname, '../../../.env.local') });

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { CampaignsModule } from './campaigns.module';

async function bootstrap() {
  const host = process.env.CAMPAIGN_SERVICE_HOST ?? '127.0.0.1';
  const port = Number(process.env.CAMPAIGN_SERVICE_PORT ?? 4003);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CampaignsModule,
    {
      transport: Transport.TCP,
      options: {
        host,
        port,
      },
    },
  );

  await app.listen();

  Logger.log(
    `Campaigns microservice listening on tcp://${host}:${port}`,
    'CampaignsServiceBootstrap',
  );
}

bootstrap();
