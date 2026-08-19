import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';
import type { ResidentFacilityType } from '@m-square/contracts';

export class AssignResidentFacilityDto {
  @ApiProperty({
    description: 'Catalog facility UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  facilityId!: string;

  @ApiPropertyOptional({
    description: 'Facility assignment type',
    enum: ['INCLUDED', 'PAID', 'OPTIONAL'],
    example: 'INCLUDED',
  })
  @IsOptional()
  @IsEnum(['INCLUDED', 'PAID', 'OPTIONAL'])
  facilityType?: ResidentFacilityType;

  @ApiPropertyOptional({ description: 'Monthly charge for paid/optional facility', example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyCharge?: number;

  @ApiPropertyOptional({ description: 'Effective date (YYYY-MM-DD)', example: '2026-08-01' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'effectiveDate must be YYYY-MM-DD' })
  effectiveDate?: string;
}
