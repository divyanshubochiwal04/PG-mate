import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: '101', description: 'Room number (unique per floor)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  roomNumber!: string;

  @ApiPropertyOptional({
    example: 'DOUBLE',
    enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_BED', 'DORMITORY', 'CUSTOM'],
  })
  @IsOptional()
  @IsIn(['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_BED', 'DORMITORY', 'CUSTOM'])
  roomType?: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR_BED' | 'DORMITORY' | 'CUSTOM';

  @ApiProperty({ example: 2, description: 'Maximum allowed beds (must be >= 1)' })
  @IsInt()
  @Min(1)
  capacity!: number;

  @ApiPropertyOptional({ example: 1, description: 'Display sequence order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
