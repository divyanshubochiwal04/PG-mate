import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [BillingController, PaymentsController],
  providers: [BillingService, PaymentsService],
  exports: [BillingService, PaymentsService],
})
export class BillingModule {}
