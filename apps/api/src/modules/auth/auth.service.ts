import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  dbService,
  KyselyOrganizationRepository,
  KyselyPasswordResetTokenRepository,
  KyselyRefreshTokenRepository,
  KyselySessionRepository,
  KyselyUnitOfWork,
  KyselyUserRepository,
} from '@m-square/database';
import { EntityConflictError, PasswordPolicy } from '@m-square/domain';
import {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  hashRefreshToken,
  verifyPassword,
} from '@m-square/security';
import { logger } from '@m-square/logger';
import { EmailService } from './services/email.service';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { RefreshDto } from './dto/refresh.dto';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { ForgotPasswordDto } from './dto/forgot-password.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';
import type { AuthResponseDto, AuthTokensDto, UserDto } from '@m-square/contracts';

// Constant dummy hash used for timing normalization on non-existent email login attempts
const DUMMY_ARGON2_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$WJzL01o/XzX3vH8K6P3jJ8J8K6P3jJ8J8K6P3jJ8J8';

@Injectable()
export class AuthService {
  constructor(private readonly emailService: EmailService) {}

  public async register(dto: RegisterDto): Promise<UserDto> {
    const normalizedEmail = PasswordPolicy.normalizeEmail(dto.email);
    PasswordPolicy.validate(dto.password);

    const userRepo = new KyselyUserRepository(dbService.db);
    const existing = await userRepo.findByEmail(normalizedEmail);

    if (existing) {
      // Prevent email discovery by returning standard error
      throw new EntityConflictError('Account registration failed');
    }

    const passwordHash = await hashPassword(dto.password);

    const uow = new KyselyUnitOfWork(dbService.db);
    return uow.runInTransaction(async (trx) => {
      const uRepo = new KyselyUserRepository(trx);
      const orgRepo = new KyselyOrganizationRepository(trx);

      const user = await uRepo.create({
        email: normalizedEmail,
        passwordHash,
        status: 'ACTIVE',
      });

      // Derive slug from email handle
      const emailHandle = normalizedEmail.split('@')[0] || 'owner';
      const rawSlug = `org-${emailHandle}-${user.id.slice(0, 8)}`;

      const org = await orgRepo.createOrganization({
        name: `${emailHandle.toUpperCase()} Organization`,
        slug: rawSlug,
        status: 'ACTIVE',
      });

      await orgRepo.createMembership(org.id, user.id);

      return {
        id: user.id,
        email: user.email,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt?.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString(),
        createdAt: user.createdAt.toISOString(),
      };
    });
  }

  public async login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponseDto> {
    const normalizedEmail = PasswordPolicy.normalizeEmail(dto.email);
    const userRepo = new KyselyUserRepository(dbService.db);
    const user = await userRepo.findByEmail(normalizedEmail);

    if (!user || user.status !== 'ACTIVE') {
      // Execute dummy hash comparison to normalize execution time
      await verifyPassword(DUMMY_ARGON2_HASH, dto.password);
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValidPassword = await verifyPassword(user.passwordHash, dto.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Login Transaction: create session, insert initial refresh token, update lastLoginAt
    const uow = new KyselyUnitOfWork(dbService.db);
    return uow.runInTransaction(async (trx) => {
      const sessionRepo = new KyselySessionRepository(trx);
      const refreshTokenRepo = new KyselyRefreshTokenRepository(trx);
      const uRepo = new KyselyUserRepository(trx);

      const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const session = await sessionRepo.createSession({
        userId: user.id,
        ipAddress,
        userAgent,
        expiresAt: sessionExpiresAt,
      });

      const rawRefreshToken = generateRefreshToken();
      const tokenHash = hashRefreshToken(rawRefreshToken);

      await refreshTokenRepo.createToken({
        sessionId: session.id,
        tokenHash,
        expiresAt: sessionExpiresAt,
        status: 'ACTIVE',
      });

      await uRepo.updateLastLogin(user.id, new Date());

      const accessToken = generateAccessToken({
        sub: user.id,
        sessionId: session.id,
      });

      const userDto: UserDto = {
        id: user.id,
        email: user.email,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt?.toISOString(),
        lastLoginAt: new Date().toISOString(),
        createdAt: user.createdAt.toISOString(),
      };

      return {
        user: userDto,
        tokens: {
          accessToken,
          refreshToken: rawRefreshToken,
        },
      };
    });
  }

  public async refresh(dto: RefreshDto): Promise<AuthTokensDto> {
    const tokenHashInput = hashRefreshToken(dto.refreshToken);

    const uow = new KyselyUnitOfWork(dbService.db);
    return uow.runInTransaction(async (trx) => {
      const refreshTokenRepo = new KyselyRefreshTokenRepository(trx);
      const sessionRepo = new KyselySessionRepository(trx);

      // Lock row FOR UPDATE to prevent race conditions
      const tokenRecord = await refreshTokenRepo.findByHashForUpdate(tokenHashInput);

      if (!tokenRecord) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check TOKEN REUSE DETECTED
      if (tokenRecord.status === 'ROTATED' || tokenRecord.status === 'REVOKED') {
        logger.warn('REFRESH TOKEN REUSE DETECTED — Revoking complete session family', {
          sessionId: tokenRecord.sessionId,
          tokenId: tokenRecord.id,
        });

        await sessionRepo.revokeSession(tokenRecord.sessionId, 'TOKEN_REUSE_DETECTED');
        await refreshTokenRepo.revokeSessionTokens(tokenRecord.sessionId);
        throw new UnauthorizedException('Security alert: Session revoked due to token reuse');
      }

      // Verify Session status
      const session = await sessionRepo.findActiveById(tokenRecord.sessionId);
      if (!session) {
        throw new UnauthorizedException('Session expired or revoked');
      }

      // Mark current token ROTATED
      const now = new Date();
      await refreshTokenRepo.markRotated(tokenRecord.id, now);

      // Generate NEW token pair
      const rawNewRefreshToken = generateRefreshToken();
      const newHash = hashRefreshToken(rawNewRefreshToken);

      await refreshTokenRepo.createToken({
        sessionId: session.id,
        tokenHash: newHash,
        expiresAt: session.expiresAt,
        status: 'ACTIVE',
      });

      await sessionRepo.touchSession(session.id);

      const newAccessToken = generateAccessToken({
        sub: session.userId,
        sessionId: session.id,
      });

      return {
        accessToken: newAccessToken,
        refreshToken: rawNewRefreshToken,
      };
    });
  }

  public async logout(sessionId: string): Promise<void> {
    const sessionRepo = new KyselySessionRepository(dbService.db);
    const refreshTokenRepo = new KyselyRefreshTokenRepository(dbService.db);

    await sessionRepo.revokeSession(sessionId, 'LOGOUT');
    await refreshTokenRepo.revokeSessionTokens(sessionId);
  }

  public async logoutAll(userId: string): Promise<{ count: number }> {
    const sessionRepo = new KyselySessionRepository(dbService.db);
    const count = await sessionRepo.revokeAllUserSessions(userId, 'LOGOUT_ALL');
    return { count };
  }

  public async changePassword(userId: string, dto: ChangePasswordDto): Promise<AuthTokensDto> {
    PasswordPolicy.validate(dto.newPassword);
    const userRepo = new KyselyUserRepository(dbService.db);
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValidCurrent = await verifyPassword(user.passwordHash, dto.currentPassword);
    if (!isValidCurrent) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newHash = await hashPassword(dto.newPassword);

    const uow = new KyselyUnitOfWork(dbService.db);
    return uow.runInTransaction(async (trx) => {
      const uRepo = new KyselyUserRepository(trx);
      const sRepo = new KyselySessionRepository(trx);
      const rRepo = new KyselyRefreshTokenRepository(trx);

      await uRepo.updatePassword(userId, newHash);
      await sRepo.revokeAllUserSessions(userId, 'PASSWORD_CHANGED');

      // Create new session & replacement tokens
      const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const newSession = await sRepo.createSession({
        userId,
        expiresAt: sessionExpiresAt,
      });

      const rawRefreshToken = generateRefreshToken();
      const tokenHash = hashRefreshToken(rawRefreshToken);

      await rRepo.createToken({
        sessionId: newSession.id,
        tokenHash,
        expiresAt: sessionExpiresAt,
        status: 'ACTIVE',
      });

      const accessToken = generateAccessToken({
        sub: userId,
        sessionId: newSession.id,
      });

      return {
        accessToken,
        refreshToken: rawRefreshToken,
      };
    });
  }

  public async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const normalizedEmail = PasswordPolicy.normalizeEmail(dto.email);
    const userRepo = new KyselyUserRepository(dbService.db);
    const user = await userRepo.findByEmail(normalizedEmail);

    const genericResponse = {
      message: 'If an account exists for this email, password reset instructions have been sent.',
    };

    if (!user) {
      return genericResponse;
    }

    const uow = new KyselyUnitOfWork(dbService.db);
    await uow.runInTransaction(async (trx) => {
      const resetRepo = new KyselyPasswordResetTokenRepository(trx);
      await resetRepo.invalidateAllUserTokens(user.id);

      const rawResetToken = randomBytes(32).toString('hex');
      const tokenHash = hashRefreshToken(rawResetToken);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      await resetRepo.createToken({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      await this.emailService.sendPasswordResetEmail(user.email, rawResetToken);
    });

    return genericResponse;
  }

  public async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    PasswordPolicy.validate(dto.newPassword);
    const tokenHash = hashRefreshToken(dto.token);

    const uow = new KyselyUnitOfWork(dbService.db);
    await uow.runInTransaction(async (trx) => {
      const resetRepo = new KyselyPasswordResetTokenRepository(trx);
      const uRepo = new KyselyUserRepository(trx);
      const sRepo = new KyselySessionRepository(trx);

      const tokenRecord = await resetRepo.findByHashForUpdate(tokenHash);

      if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt < new Date()) {
        throw new BadRequestException('Invalid or expired password reset token');
      }

      const newHash = await hashPassword(dto.newPassword);
      const now = new Date();

      await uRepo.updatePassword(tokenRecord.userId, newHash);
      await resetRepo.markUsed(tokenRecord.id, now);
      await resetRepo.invalidateAllUserTokens(tokenRecord.userId);
      await sRepo.revokeAllUserSessions(tokenRecord.userId, 'PASSWORD_RESET');
    });

    return {
      message: 'Password has been reset successfully. Please log in with your new password.',
    };
  }

  public async me(userId: string): Promise<UserDto> {
    const userRepo = new KyselyUserRepository(dbService.db);
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
    };
  }
}
