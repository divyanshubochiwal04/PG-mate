import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateBedDto {
  @ApiPropertyOptional({ example: 'Bed B', description: 'Bed label / identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bedNumber?: string;

  @ApiPropertyOptional({ example: 1, description: 'Display sequence order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({
    enum: ['AVAILABLE', 'INACTIVE', 'MAINTENANCE'],
    description: 'Bed status',
  })
  @IsOptional()
  @IsEnum(['AVAILABLE', 'INACTIVE', 'MAINTENANCE'])
  status?: 'AVAILABLE' | 'INACTIVE' | 'MAINTENANCE';
}
