import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateRoomDto {
  @ApiPropertyOptional({ example: '102', description: 'Room number / identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  roomNumber?: string;

  @ApiPropertyOptional({
    enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_BED', 'DORMITORY', 'CUSTOM'],
    description: 'Room type',
  })
  @IsOptional()
  @IsEnum(['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_BED', 'DORMITORY', 'CUSTOM'])
  roomType?: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR_BED' | 'DORMITORY' | 'CUSTOM';

  @ApiPropertyOptional({ example: 1, description: 'Display sequence order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({
    enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
    description: 'Room status',
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'MAINTENANCE'])
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}
