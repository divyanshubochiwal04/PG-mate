import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantAuthorizationGuard } from '../tenant/guards/tenant-authorization.guard';
import { RequestContext } from '../../common/context/request-context';
import { CommercialService } from './commercial.service';
import { CreateCommercialAgreementDto } from './dto/create-commercial-agreement.dto';
import { AssignResidentFacilityDto } from './dto/assign-resident-facility.dto';
import { CreateAdditionalChargeDto } from './dto/create-additional-charge.dto';

@ApiTags('Resident Commercial')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantAuthorizationGuard)
@Controller('residents/:residentId/commercial')
export class CommercialController {
  constructor(private readonly commercialService: CommercialService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get active resident commercial summary' })
  @ApiResponse({ status: 200, description: 'Commercial summary retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Resident not found' })
  public async getSummary(@Param('residentId') residentId: string) {
    return this.commercialService.getCommercialSummary(this.getOrgId(), residentId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get historical commercial agreement revisions' })
  @ApiResponse({ status: 200, description: 'Commercial agreement history retrieved' })
  public async getHistory(@Param('residentId') residentId: string) {
    return this.commercialService.getCommercialHistory(this.getOrgId(), residentId);
  }

  @Post('agreement')
  @ApiOperation({ summary: 'Create new pricing revision for resident' })
  @ApiResponse({ status: 201, description: 'Pricing revision created successfully' })
  public async createAgreementRevision(
    @Param('residentId') residentId: string,
    @Body() dto: CreateCommercialAgreementDto
  ) {
    return this.commercialService.createAgreementRevision(this.getOrgId(), residentId, dto);
  }

  @Post('facilities')
  @ApiOperation({ summary: 'Assign catalog facility to resident' })
  @ApiResponse({ status: 201, description: 'Facility assigned to resident' })
  public async assignFacility(
    @Param('residentId') residentId: string,
    @Body() dto: AssignResidentFacilityDto
  ) {
    return this.commercialService.assignResidentFacility(this.getOrgId(), residentId, dto);
  }

  @Delete('facilities/:facilityId')
  @ApiOperation({ summary: 'Revoke resident facility assignment' })
  @ApiResponse({ status: 200, description: 'Facility assignment revoked' })
  public async revokeFacility(
    @Param('residentId') residentId: string,
    @Param('facilityId') facilityId: string
  ) {
    await this.commercialService.revokeResidentFacility(this.getOrgId(), residentId, facilityId);
    return { revoked: true };
  }

  @Post('charges')
  @ApiOperation({ summary: 'Add additional charge to resident' })
  @ApiResponse({ status: 201, description: 'Additional charge added' })
  public async addCharge(
    @Param('residentId') residentId: string,
    @Body() dto: CreateAdditionalChargeDto
  ) {
    return this.commercialService.addAdditionalCharge(this.getOrgId(), residentId, dto);
  }

  @Delete('charges/:chargeId')
  @ApiOperation({ summary: 'Cancel additional charge' })
  @ApiResponse({ status: 200, description: 'Additional charge cancelled' })
  public async cancelCharge(
    @Param('residentId') residentId: string,
    @Param('chargeId') chargeId: string
  ) {
    await this.commercialService.cancelAdditionalCharge(this.getOrgId(), residentId, chargeId);
    return { cancelled: true };
  }

  private getOrgId(): string {
    const orgId = RequestContext.organizationId;
    if (!orgId) {
      throw new InternalServerErrorException(
        'Organization ID context missing in commercial controller'
      );
    }
    return orgId;
  }
}
