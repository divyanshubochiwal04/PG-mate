import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateCapacityDto {
  @ApiProperty({ example: 4, description: 'New maximum bed capacity (must be >= 1)' })
  @IsInt()
  @Min(1)
  capacity!: number;
}
