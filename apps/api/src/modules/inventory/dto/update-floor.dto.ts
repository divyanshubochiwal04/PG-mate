import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateFloorDto {
  @ApiPropertyOptional({ example: '2nd Floor', description: 'Floor display label' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 2, description: 'Integer floor number (0 = Ground)' })
  @IsOptional()
  @IsInt()
  floorNumber?: number;

  @ApiPropertyOptional({ example: 2, description: 'Display sequence order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'], description: 'Floor status' })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';
}
