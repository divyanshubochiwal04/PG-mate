import { Module } from '@nestjs/common';
import { MessController } from './mess.controller';
import { MessService } from './mess.service';
import { MessInventoryService } from './mess-inventory.service';
import { MessSubscriptionService } from './mess-subscription.service';

@Module({
  controllers: [MessController],
  providers: [MessService, MessInventoryService, MessSubscriptionService],
  exports: [MessService, MessInventoryService, MessSubscriptionService],
})
export class MessModule {}
