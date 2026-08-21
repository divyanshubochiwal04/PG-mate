import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { UserDto } from '@m-square/contracts';

export const CurrentUser = createParamDecorator(
  (data: keyof UserDto | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserDto | undefined;
    return data && user ? user[data] : user;
  }
);
