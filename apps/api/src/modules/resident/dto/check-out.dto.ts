import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class CheckOutDto {
  @ApiPropertyOptional({ example: '2026-08-11', description: 'Actual checkout date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'actualCheckoutDate must be YYYY-MM-DD format' })
  actualCheckoutDate?: string;

  @ApiPropertyOptional({ example: 'Normal course completion', description: 'Checkout notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
