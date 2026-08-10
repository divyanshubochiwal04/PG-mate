import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateBedStatusDto {
  @ApiProperty({
    example: 'AVAILABLE',
    enum: ['AVAILABLE', 'INACTIVE', 'MAINTENANCE'],
    description: 'New bed status',
  })
  @IsIn(['AVAILABLE', 'INACTIVE', 'MAINTENANCE'])
  status!: 'AVAILABLE' | 'INACTIVE' | 'MAINTENANCE';
}
