import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateStayDto {
  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  expectedCheckoutDate?: string;

  @ApiPropertyOptional({ example: 'Requested corner bed near window' })
  @IsOptional()
  @IsString()
  notes?: string;
}
