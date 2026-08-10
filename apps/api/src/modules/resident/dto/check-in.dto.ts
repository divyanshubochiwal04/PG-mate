import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class CheckInDto {
  @ApiProperty({ example: 'uuid-resident-id', description: 'Target resident UUID' })
  @IsUUID()
  @IsNotEmpty()
  residentId!: string;

  @ApiProperty({ example: 'uuid-bed-id', description: 'Target bed UUID' })
  @IsUUID()
  @IsNotEmpty()
  bedId!: string;

  @ApiPropertyOptional({ example: '2026-08-11', description: 'Admission date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'admissionDate must be YYYY-MM-DD format' })
  admissionDate?: string;

  @ApiPropertyOptional({ example: '2027-08-11', description: 'Expected checkout date' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'expectedCheckoutDate must be YYYY-MM-DD format' })
  expectedCheckoutDate?: string;

  @ApiPropertyOptional({ example: 'Initial admission', description: 'Stay notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
