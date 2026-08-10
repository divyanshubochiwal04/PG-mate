import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { UserDto } from '@m-square/contracts';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): UserDto => {
  const request = ctx.switchToHttp().getRequest();
  return request.user as UserDto;
});
