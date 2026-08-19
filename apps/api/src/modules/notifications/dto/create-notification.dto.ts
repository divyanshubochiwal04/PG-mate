import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import type {
  NotificationSeverity,
  NotificationType,
} from '@m-square/contracts';

export class CreateNotificationDto {
  @IsEnum([
    'OUTSTANDING_DUES',
    'OVERDUE_INVOICE',
    'LOW_STOCK',
    'OUT_OF_STOCK',
    'NO_STAY',
    'UPCOMING_CHECKOUT',
    'HIGH_OCCUPANCY',
    'PAYMENT_RECEIVED',
    'RESIDENT_CHECKED_IN',
    'RESIDENT_TRANSFERRED',
    'RESIDENT_CHECKED_OUT',
    'PROCUREMENT_RECORDED',
    'EXPENSE_RECORDED',
    'SYSTEM',
  ])
  type!: NotificationType;

  @IsOptional()
  @IsEnum(['INFO', 'SUCCESS', 'WARNING', 'CRITICAL'])
  severity?: NotificationSeverity;

  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsString()
  actionRoute?: string;

  @IsOptional()
  @IsObject()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  dedupeKey?: string;
}
