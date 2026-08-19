import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { BillingCycle } from '@m-square/contracts';
import { CreateAdditionalChargeDto } from './create-additional-charge.dto';

export class CheckInCommercialDto {
  @ApiProperty({ description: 'Resident UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID('4')
  residentId!: string;

  @ApiProperty({ description: 'Bed UUID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID('4')
  bedId!: string;

  @ApiPropertyOptional({ description: 'Admission Date (YYYY-MM-DD)', example: '2026-08-01' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'admissionDate must be YYYY-MM-DD' })
  admissionDate?: string;

  @ApiPropertyOptional({ description: 'Admission remarks / notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Base rent amount', example: 8000 })
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

  @ApiPropertyOptional({ description: 'Catalog facility UUIDs to assign' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  facilityIds?: string[];

  @ApiPropertyOptional({ description: 'Additional charges', type: [CreateAdditionalChargeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAdditionalChargeDto)
  additionalCharges?: CreateAdditionalChargeDto[];

  @ApiPropertyOptional({
    description: 'Mess subscription for check-in',
    example: {
      messId: '123e4567-e89b-12d3-a456-426614174000',
      mealPlanId: '123e4567-e89b-12d3-a456-426614174001',
    },
  })
  @IsOptional()
  @ValidateNested()
  messSubscription?: { messId: string; mealPlanId: string };
}
