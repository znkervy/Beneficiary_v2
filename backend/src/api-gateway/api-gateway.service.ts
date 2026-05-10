import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

import {
  HEALTH_PATTERN,
  HEALTH_SERVICE,
  AUTH_SERVICE,
  AUTH_PATTERNS,
  CAMPAIGN_SERVICE,
  CAMPAIGN_PATTERNS,
} from '../shared/tokens';

@Injectable()
export class ApiGatewayService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  constructor(
    @Inject(HEALTH_SERVICE) private readonly healthClient: ClientProxy,
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    @Inject(CAMPAIGN_SERVICE) private readonly campaignClient: ClientProxy,
  ) {}

  async onApplicationBootstrap() {
    await Promise.all([
      this.healthClient.connect(),
      this.authClient.connect(),
      this.campaignClient.connect(),
    ]);
  }

  async onApplicationShutdown() {
    await Promise.all([
      this.healthClient.close(),
      this.authClient.close(),
      this.campaignClient.close(),
    ]);
  }

  private async sendToService(client: ClientProxy, pattern: any, payload: any) {
    try {
      return await firstValueFrom(
        client.send(pattern, payload).pipe(timeout(5000)),
      );
    } catch (error: any) {
      throw new ServiceUnavailableException(
        `Service is unavailable: ${error.message}`,
      );
    }
  }

  async getHealth() {
    return this.sendToService(this.healthClient, HEALTH_PATTERN, {});
  }

  // Auth Methods
  async forgotPassword(email: string) {
    return this.sendToService(this.authClient, AUTH_PATTERNS.FORGOT_PASSWORD, { email });
  }

  async verifyResetOtp(email: string, otp: string) {
    return this.sendToService(this.authClient, AUTH_PATTERNS.VERIFY_OTP, { email, otp });
  }

  async resetPassword(reset_token: string, new_password: string) {
    return this.sendToService(this.authClient, AUTH_PATTERNS.RESET_PASSWORD, { reset_token, new_password });
  }

  // Campaign Methods
  async getCampaigns(authUserUserId: string) {
    return this.sendToService(this.campaignClient, CAMPAIGN_PATTERNS.GET_ALL, { authUserUserId });
  }

  async getInvitations(authUserUserId: string) {
    return this.sendToService(this.campaignClient, CAMPAIGN_PATTERNS.GET_INVITATIONS, { authUserUserId });
  }
}
