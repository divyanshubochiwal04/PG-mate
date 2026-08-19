import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import type {
  ResidentBillingStatusFilter,
  ResidentMessStatusFilter,
  ResidentOperationalQueryPayload,
  ResidentStayStatusFilter,
} from '@m-square/contracts';

export class ResidentOperationalQueryDto implements ResidentOperationalQueryPayload {
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
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['ALL', 'ACTIVE', 'CHECKED_OUT', 'NO_STAY'])
  stayStatus?: ResidentStayStatusFilter = 'ALL';

  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsOptional()
  @IsUUID()
  buildingId?: string;

  @IsOptional()
  @IsUUID()
  floorId?: string;

  @IsOptional()
  @IsEnum(['ALL', 'ACTIVE', 'NONE'])
  messStatus?: ResidentMessStatusFilter = 'ALL';

  @IsOptional()
  @IsEnum(['ALL', 'DUE', 'PAID'])
  billingStatus?: ResidentBillingStatusFilter = 'ALL';
}
