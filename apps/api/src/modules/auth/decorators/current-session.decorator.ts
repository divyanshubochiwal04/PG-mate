import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { SessionDto } from '@m-square/contracts';

export const CurrentSession = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): SessionDto => {
    const request = ctx.switchToHttp().getRequest();
    return request.session as SessionDto;
  }
);
