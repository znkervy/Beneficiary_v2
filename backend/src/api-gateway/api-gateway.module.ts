import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { HEALTH_SERVICE, AUTH_SERVICE, CAMPAIGN_SERVICE } from '../shared/tokens';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: HEALTH_SERVICE,
        useFactory: () => ({
          transport: Transport.TCP,
          options: {
            host: process.env.HEALTH_SERVICE_HOST ?? '127.0.0.1',
            port: Number(process.env.HEALTH_SERVICE_PORT ?? 4001),
          },
        }),
      },
      {
        name: AUTH_SERVICE,
        useFactory: () => ({
          transport: Transport.TCP,
          options: {
            host: process.env.AUTH_SERVICE_HOST ?? '127.0.0.1',
            port: Number(process.env.AUTH_SERVICE_PORT ?? 4002),
          },
        }),
      },
      {
        name: CAMPAIGN_SERVICE,
        useFactory: () => ({
          transport: Transport.TCP,
          options: {
            host: process.env.CAMPAIGN_SERVICE_HOST ?? '127.0.0.1',
            port: Number(process.env.CAMPAIGN_SERVICE_PORT ?? 4003),
          },
        }),
      },
    ]),
  ],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
})
export class ApiGatewayModule {}
