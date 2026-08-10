import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse as SwaggerResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantAuthorizationGuard } from './guards/tenant-authorization.guard';
import { CurrentOrganization } from './decorators/current-organization.decorator';
import type { OrganizationDto } from '@m-square/contracts';

@ApiTags('Organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard, TenantAuthorizationGuard)
export class TenantController {
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer-auth')
  @ApiOperation({ summary: 'Get current authenticated user organization profile' })
  @SwaggerResponse({ status: 200, description: 'Organization profile retrieved' })
  @SwaggerResponse({ status: 401, description: 'Unauthenticated request' })
  @SwaggerResponse({ status: 403, description: 'Organization suspended or user unassociated' })
  async me(@CurrentOrganization() organization: OrganizationDto): Promise<OrganizationDto> {
    return organization;
  }
}
