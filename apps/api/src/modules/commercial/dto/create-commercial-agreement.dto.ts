import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';
import type { BillingCycle } from '@m-square/contracts';

export class CreateCommercialAgreementDto {
  @ApiProperty({ description: 'Base monthly rent amount', example: 8000 })
  @IsNumber()
  @Min(0)
  baseRentAmount!: number;

  @ApiPropertyOptional({ description: 'Security deposit amount', example: 8000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  securityDepositAmount?: number;

  @ApiPropertyOptional({
    description: 'Billing cycle policy',
    enum: ['FIRST_OF_MONTH', 'JOINING_DATE'],
    example: 'JOINING_DATE',
  })
  @IsOptional()
  @IsEnum(['FIRST_OF_MONTH', 'JOINING_DATE'])
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({ description: 'Effective date (YYYY-MM-DD)', example: '2026-08-01' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'effectiveDate must be YYYY-MM-DD' })
  effectiveDate?: string;
}
