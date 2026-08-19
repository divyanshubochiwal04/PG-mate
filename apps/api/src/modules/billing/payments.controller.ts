import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantAuthorizationGuard } from '../tenant/guards/tenant-authorization.guard';
import { RequestContext } from '../../common/context/request-context';
import { PaymentsService } from './payments.service';
import { RecordPaymentDto } from './dto/record-payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantAuthorizationGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List recorded payment transactions' })
  public async getPayments(@Query('page') page?: number, @Query('pageSize') pageSize?: number) {
    return this.paymentsService.getPayments(
      this.getOrgId(),
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20
    );
  }

  @Post()
  @ApiOperation({ summary: 'Record payment collection (Idempotent)' })
  public async recordPayment(@Body() dto: RecordPaymentDto) {
    const userId = RequestContext.userId || null;
    return this.paymentsService.recordPayment(this.getOrgId(), userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details by ID' })
  public async getPaymentById(@Param('id') id: string) {
    return this.paymentsService.getPaymentById(this.getOrgId(), id);
  }

  @Get(':id/receipt')
  @ApiOperation({ summary: 'Get receipt for payment transaction' })
  public async getReceiptByPaymentId(@Param('id') id: string) {
    return this.paymentsService.getReceiptByPaymentId(this.getOrgId(), id);
  }

  private getOrgId(): string {
    const orgId = RequestContext.organizationId;
    if (!orgId) {
      throw new InternalServerErrorException(
        'Organization ID context missing in payments controller'
      );
    }
    return orgId;
  }
}
