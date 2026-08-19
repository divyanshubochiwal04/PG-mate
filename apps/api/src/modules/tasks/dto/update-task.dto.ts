import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import type { UpdateTaskDto as IUpdateTaskDto, TaskPriority } from '@m-square/contracts';

export class UpdateTaskDto implements IUpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

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
}
