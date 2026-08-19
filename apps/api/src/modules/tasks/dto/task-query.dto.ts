import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import type { TaskPriority, TaskQueryDto as ITaskQueryDto, TaskStatus } from '@m-square/contracts';

export class TaskQueryDto implements ITaskQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  @IsOptional()
  priority?: TaskPriority;

  @IsUUID()
  @IsOptional()
  assignedToUserId?: string;

  @IsUUID()
  @IsOptional()
  residentId?: string;

  @IsDateString()
  @IsOptional()
  dueFrom?: string;

  @IsDateString()
  @IsOptional()
  dueTo?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  overdue?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 20;
}
