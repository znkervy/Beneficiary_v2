import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';

import { ApiGatewayService } from './api-gateway.service';
import { ForgotPasswordDto } from '../auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '../auth/dto/reset-password.dto';
import { VerifyResetOtpDto } from '../auth/dto/verify-reset-otp.dto';

@Controller()
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  @Get('health')
  getHealth() {
    return this.apiGatewayService.getHealth();
  }

  // Auth Proxy Endpoints
  @Post('auth/forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.apiGatewayService.forgotPassword(dto.email);
  }

  @Post('auth/verify-reset-otp')
  @HttpCode(200)
  verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    return this.apiGatewayService.verifyResetOtp(dto.email, dto.otp);
  }

  @Post('auth/reset-password')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.apiGatewayService.resetPassword(dto.reset_token, dto.new_password);
  }

  // Campaign Proxy Endpoints (Note: In a real app, authUserUserId would come from a JWT)
  @Get('campaigns')
  getCampaigns(@Query('userId') userId: string) {
    return this.apiGatewayService.getCampaigns(userId);
  }

  @Get('campaigns/invitations')
  getInvitations(@Query('userId') userId: string) {
    return this.apiGatewayService.getInvitations(userId);
  }
}
