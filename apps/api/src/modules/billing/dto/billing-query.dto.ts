import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';
import type { InvoiceStatusDto } from '@m-square/contracts';

export class BillingQueryDto {
  @ApiPropertyOptional({ description: 'Search term for resident name, code, invoice number, phone' })
  @IsOptional()
  @IsString()
  public search?: string;

  @ApiPropertyOptional({ description: 'Property UUID filter' })
  @IsOptional()
  @IsUUID('4', { message: 'propertyId must be a valid UUID' })
  public propertyId?: string;

  @ApiPropertyOptional({ description: 'Building UUID filter' })
  @IsOptional()
  @IsUUID('4', { message: 'buildingId must be a valid UUID' })
  public buildingId?: string;

  @ApiPropertyOptional({ description: 'Billing period (YYYY-MM)' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, { message: 'billingPeriod must be in YYYY-MM format' })
  public billingPeriod?: string;

  @ApiPropertyOptional({
    description: 'Invoice Status filter',
    enum: ['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'],
  })
  @IsOptional()
  @IsEnum(['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'])
  public status?: InvoiceStatusDto;

  @ApiPropertyOptional({ description: 'Resident UUID filter' })
  @IsOptional()
  @IsUUID('4', { message: 'residentId must be a valid UUID' })
  public residentId?: string;

  @ApiPropertyOptional({ description: 'Stay UUID filter' })
  @IsOptional()
  @IsUUID('4', { message: 'stayId must be a valid UUID' })
  public stayId?: string;

  @ApiPropertyOptional({ description: 'Page number (default 1)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size (default 20)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public pageSize?: number = 20;
}
