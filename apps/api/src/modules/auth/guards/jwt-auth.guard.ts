import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { verifyAccessToken } from '@m-square/security';
import { dbService, KyselySessionRepository, KyselyUserRepository } from '@m-square/database';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestContext } from '../../../common/context/request-context';
import type { SessionDto, UserDto } from '@m-square/contracts';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.substring(7).trim();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payload: Record<string, any>;

    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const userId = payload['sub'] as string;
    const sessionId = payload['sessionId'] as string;

    if (!userId || !sessionId) {
      throw new UnauthorizedException('Malformed token payload');
    }

    const sessionRepo = new KyselySessionRepository(dbService.db);
    const userRepo = new KyselyUserRepository(dbService.db);

    const session = await sessionRepo.findActiveById(sessionId);
    if (!session) {
      throw new UnauthorizedException('Session expired or revoked');
    }

    const user = await userRepo.findById(userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account inactive or suspended');
    }

    // Touch session activity
    void sessionRepo.touchSession(sessionId);

    const userDto: UserDto = {
      id: user.id,
      email: user.email,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
    };

    const sessionDto: SessionDto = {
      id: session.id,
      userId: session.userId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt.toISOString(),
      lastUsedAt: session.lastUsedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
    };

    // Attach to request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any).user = userDto;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any).session = sessionDto;

    // Update RequestContext
    RequestContext.setUserId(user.id);

    return true;
  }
}
