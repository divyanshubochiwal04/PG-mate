import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';
import type { AdditionalChargeType } from '@m-square/contracts';

export class CreateAdditionalChargeDto {
  @ApiProperty({
    description: 'Charge classification',
    enum: ['MAINTENANCE', 'PARKING', 'EXTRA_FACILITY', 'ONE_TIME_FEE', 'CUSTOM'],
    example: 'PARKING',
  })
  @IsEnum(['MAINTENANCE', 'PARKING', 'EXTRA_FACILITY', 'ONE_TIME_FEE', 'CUSTOM'])
  chargeType!: AdditionalChargeType;

  @ApiProperty({ description: 'Description or reason for charge', example: 'Covered Car Parking' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Charge amount', example: 500 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ description: 'Whether charge recurs monthly', example: true })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ description: 'Effective date (YYYY-MM-DD)', example: '2026-08-01' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'effectiveDate must be YYYY-MM-DD' })
  effectiveDate?: string;
}
