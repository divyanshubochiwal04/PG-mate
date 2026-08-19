import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  Matches,
} from 'class-validator';
import type {
  NotificationSeverity,
  NotificationStatus,
  NotificationType,
} from '@m-square/contracts';

export class NotificationQueryDto {
  @IsOptional()
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
  type?: NotificationType;

  @IsOptional()
  @IsEnum(['INFO', 'SUCCESS', 'WARNING', 'CRITICAL'])
  severity?: NotificationSeverity;

  @IsOptional()
  @IsEnum(['UNREAD', 'READ', 'RESOLVED', 'DISMISSED'])
  status?: NotificationStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fromDate must be in YYYY-MM-DD format' })
  fromDate?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'toDate must be in YYYY-MM-DD format' })
  toDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}
