import { Controller, Post, Body, UseGuards, Req, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() data: unknown) {
    const parsed = RegisterDto.parse(data); 
    return this.authService.register(parsed);
  }

  @Post('login')
  async login(@Body() data: unknown) {
    const parsed = LoginDto.parse(data);
    return this.authService.login(parsed);
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(@Req() req, @Body() data: unknown) {
    const parsed = ChangePasswordDto.parse(data);
    return this.authService.changePassword(req.user.sub, parsed);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() data: unknown) {
    const parsed = ForgotPasswordDto.parse(data);
    return this.authService.forgotPassword(parsed);
  }

  @Post('reset-password')
  async resetPassword(@Body() data: unknown) {
    const parsed = ResetPasswordDto.parse(data);
    return this.authService.resetPassword(parsed);
  }
}