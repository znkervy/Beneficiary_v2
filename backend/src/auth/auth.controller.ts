import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { AUTH_PATTERNS } from '../shared/tokens';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(AUTH_PATTERNS.FORGOT_PASSWORD)
  forgotPassword(@Payload() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @MessagePattern(AUTH_PATTERNS.VERIFY_OTP)
  verifyResetOtp(@Payload() dto: VerifyResetOtpDto) {
    return this.authService.verifyResetOtp(dto.email, dto.otp);
  }

  @MessagePattern(AUTH_PATTERNS.RESET_PASSWORD)
  resetPassword(@Payload() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.reset_token, dto.new_password);
  }
}
