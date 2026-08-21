import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { OrganizationDto } from '@m-square/contracts';

export const CurrentOrganization = createParamDecorator(
  (data: keyof OrganizationDto | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const organization = request.organization as OrganizationDto | undefined;
    return data && organization ? organization[data] : organization;
  }
);
