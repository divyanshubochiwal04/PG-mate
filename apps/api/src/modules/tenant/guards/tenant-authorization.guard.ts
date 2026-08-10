import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator';
import { RequestContext } from '../../../common/context/request-context';
import { TenantContextService } from '../services/tenant-context.service';
import type { OrganizationDto } from '@m-square/contracts';

@Injectable()
export class TenantAuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContextService: TenantContextService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const userId = RequestContext.userId;
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const orgContext = await this.tenantContextService.resolveForUser(userId);
    if (!orgContext) {
      throw new ForbiddenException('User is not associated with any organization');
    }

    if (orgContext.status !== 'ACTIVE') {
      throw new ForbiddenException(`Organization account is ${orgContext.status.toLowerCase()}`);
    }

    // Attach trusted organizationId to RequestContext
    RequestContext.setOrganizationId(orgContext.organizationId);

    const request = context.switchToHttp().getRequest();
    const organizationDto: OrganizationDto = {
      id: orgContext.organizationId,
      name: orgContext.name,
      slug: orgContext.slug,
      status: orgContext.status,
      createdAt: new Date().toISOString(),
    };

    // Attach organization context to HTTP request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any).organization = organizationDto;

    return true;
  }
}
