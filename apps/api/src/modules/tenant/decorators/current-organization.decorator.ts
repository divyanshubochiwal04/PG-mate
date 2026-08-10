import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { OrganizationDto } from '@m-square/contracts';

export const CurrentOrganization = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): OrganizationDto => {
    const request = ctx.switchToHttp().getRequest();
    return request.organization as OrganizationDto;
  }
);
