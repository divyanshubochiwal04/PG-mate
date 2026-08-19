import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import type { CreateTaskDto as ICreateTaskDto, TaskPriority } from '@m-square/contracts';

export class CreateTaskDto implements ICreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  @IsOptional()
  priority?: TaskPriority;

  @IsDateString()
  @IsOptional()
  dueDate?: string | null;

  @IsUUID()
  @IsOptional()
  assignedToUserId?: string | null;

  @IsUUID()
  @IsOptional()
  residentId?: string | null;

  @IsUUID()
  @IsOptional()
  invoiceId?: string | null;

  @IsUUID()
  @IsOptional()
  paymentId?: string | null;

  @IsUUID()
  @IsOptional()
  inventoryItemId?: string | null;

  @IsUUID()
  @IsOptional()
  procurementId?: string | null;

  @IsUUID()
  @IsOptional()
  expenseId?: string | null;

  @IsUUID()
  @IsOptional()
  notificationId?: string | null;
}
