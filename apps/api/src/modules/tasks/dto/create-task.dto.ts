import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import type { CreateTaskDto as ICreateTaskDto, TaskPriority } from '@m-square/contracts';

export class CreateTaskDto implements ICreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  description?: string | null;

  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  priority?: TaskPriority;

  @IsDateString()
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  dueDate?: string | null;

  @IsUUID()
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  assignedToUserId?: string | null;

  @IsUUID()
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  residentId?: string | null;

  @IsUUID()
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  invoiceId?: string | null;

  @IsUUID()
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  paymentId?: string | null;

  @IsUUID()
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  inventoryItemId?: string | null;

  @IsUUID()
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  procurementId?: string | null;

  @IsUUID()
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  expenseId?: string | null;

  @IsUUID()
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  notificationId?: string | null;
}
