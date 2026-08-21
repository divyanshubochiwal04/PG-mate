import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import type { UpdateTaskDto as IUpdateTaskDto, TaskPriority } from '@m-square/contracts';

export class UpdateTaskDto implements IUpdateTaskDto {
  @IsString()
  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  title?: string;

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
}
