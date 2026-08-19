import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantAuthorizationGuard } from '../tenant/guards/tenant-authorization.guard';
import { RequestContext } from '../../common/context/request-context';
import { BillingService } from './billing.service';
import { BillingQueryDto } from './dto/billing-query.dto';
import { GenerateInvoicesDto } from './dto/generate-invoices.dto';
import type { UpdateBillingConfigDto } from '@m-square/contracts';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantAuthorizationGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get organization billing configuration' })
  public async getConfig() {
    return this.billingService.getConfig(this.getOrgId());
  }

  @Put('config')
  @ApiOperation({ summary: 'Update organization billing configuration' })
  public async updateConfig(@Body() dto: UpdateBillingConfigDto) {
    return this.billingService.updateConfig(this.getOrgId(), dto);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get owner billing & dues overview metrics' })
  public async getOverview() {
    return this.billingService.getOverview(this.getOrgId());
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List tenant invoices with search & filters' })
  public async getInvoices(@Query() query: BillingQueryDto) {
    return this.billingService.getInvoices(this.getOrgId(), query);
  }

  @Post('invoices/generate')
  @ApiOperation({ summary: 'Generate monthly invoices for active stays' })
  public async generateInvoices(@Body() dto?: GenerateInvoicesDto) {
    return this.billingService.generateInvoices(this.getOrgId(), dto);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice details by ID' })
  public async getInvoiceById(@Param('id') id: string) {
    return this.billingService.getInvoiceById(this.getOrgId(), id);
  }

  @Post('invoices/:id/cancel')
  @ApiOperation({ summary: 'Cancel invoice by ID' })
  public async cancelInvoice(@Param('id') id: string) {
    return this.billingService.cancelInvoice(this.getOrgId(), id);
  }

  @Get('residents/:residentId/summary')
  @ApiOperation({ summary: 'Get compact resident financial summary & statement' })
  public async getResidentSummary(@Param('residentId') residentId: string) {
    return this.billingService.getResidentSummary(this.getOrgId(), residentId);
  }

  @Get('residents/:residentId/ledger')
  @ApiOperation({ summary: 'Get chronological resident financial ledger' })
  public async getResidentLedger(@Param('residentId') residentId: string) {
    return this.billingService.getResidentLedger(this.getOrgId(), residentId);
  }

  private getOrgId(): string {
    const orgId = RequestContext.organizationId;
    if (!orgId) {
      throw new InternalServerErrorException(
        'Organization ID context missing in billing controller'
      );
    }
    return orgId;
  }
}
