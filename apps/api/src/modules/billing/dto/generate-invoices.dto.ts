import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class GenerateInvoicesDto {
  @ApiPropertyOptional({ description: 'Billing Period (YYYY-MM)', example: '2026-08' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, { message: 'billingPeriod must be in YYYY-MM format' })
  public billingPeriod?: string;

  @ApiPropertyOptional({ description: 'Property UUID filter' })
  @IsOptional()
  @IsUUID('4', { message: 'propertyId must be a valid UUID' })
  public propertyId?: string;

  @ApiPropertyOptional({ description: 'Building UUID filter' })
  @IsOptional()
  @IsUUID('4', { message: 'buildingId must be a valid UUID' })
  public buildingId?: string;

  @ApiPropertyOptional({ description: 'Resident UUID filter' })
  @IsOptional()
  @IsUUID('4', { message: 'residentId must be a valid UUID' })
  public residentId?: string;

  @ApiPropertyOptional({ description: 'Stay UUID filter' })
  @IsOptional()
  @IsUUID('4', { message: 'stayId must be a valid UUID' })
  public stayId?: string;
}
