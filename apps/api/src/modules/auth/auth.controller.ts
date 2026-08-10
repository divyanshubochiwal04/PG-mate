import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse as SwaggerResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { CurrentSession } from './decorators/current-session.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { RefreshDto } from './dto/refresh.dto';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { ForgotPasswordDto } from './dto/forgot-password.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';
import type { AuthResponseDto, AuthTokensDto, SessionDto, UserDto } from '@m-square/contracts';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @SwaggerResponse({ status: 201, description: 'User successfully registered' })
  @SwaggerResponse({ status: 400, description: 'Validation failure or duplicate user' })
  async register(@Body() dto: RegisterDto): Promise<UserDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user credentials and obtain session tokens' })
  @SwaggerResponse({ status: 200, description: 'Login successful' })
  @SwaggerResponse({ status: 401, description: 'Invalid email or password' })
  async login(@Body() dto: LoginDto, @Req() req: Request): Promise<AuthResponseDto> {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || undefined;
    const userAgent = req.headers['user-agent'] || undefined;
    return this.authService.login(dto, ip, userAgent);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  @SwaggerResponse({ status: 200, description: 'Tokens rotated successfully' })
  @SwaggerResponse({ status: 401, description: 'Invalid, expired, or reused refresh token' })
  async refresh(@Body() dto: RefreshDto): Promise<AuthTokensDto> {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer-auth')
  @ApiOperation({ summary: 'Revoke the current active session' })
  @SwaggerResponse({ status: 200, description: 'Session revoked successfully' })
  async logout(@CurrentSession() session: SessionDto): Promise<{ message: string }> {
    await this.authService.logout(session.id);
    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer-auth')
  @ApiOperation({ summary: 'Revoke all active sessions for the authenticated user' })
  @SwaggerResponse({ status: 200, description: 'All user sessions revoked' })
  async logoutAll(@CurrentUser() user: UserDto): Promise<{ count: number }> {
    return this.authService.logoutAll(user.id);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer-auth')
  @ApiOperation({ summary: 'Change password and revoke other active sessions' })
  @SwaggerResponse({ status: 200, description: 'Password changed successfully' })
  @SwaggerResponse({ status: 400, description: 'Current password incorrect or validation error' })
  async changePassword(
    @CurrentUser() user: UserDto,
    @Body() dto: ChangePasswordDto
  ): Promise<AuthTokensDto> {
    return this.authService.changePassword(user.id, dto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email link' })
  @SwaggerResponse({ status: 200, description: 'Reset instructions sent if email exists' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a single-use reset token' })
  @SwaggerResponse({ status: 200, description: 'Password reset successfully' })
  @SwaggerResponse({ status: 400, description: 'Invalid or expired reset token' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer-auth')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @SwaggerResponse({ status: 200, description: 'Profile retrieved' })
  async me(@CurrentUser() user: UserDto): Promise<UserDto> {
    return this.authService.me(user.id);
  }
}
