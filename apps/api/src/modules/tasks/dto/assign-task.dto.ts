import { IsOptional, IsUUID } from 'class-validator';

export class AssignTaskDto {
  @IsUUID()
  @IsOptional()
  assignedToUserId?: string | null;
}
