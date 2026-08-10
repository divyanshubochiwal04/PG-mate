import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateFloorDto {
  @ApiProperty({ example: '1st Floor', description: 'Floor display label' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 1,
    description: 'Integer floor number (e.g. 0 for Ground, 1 for 1st Floor)',
  })
  @IsInt()
  floorNumber!: number;

  @ApiPropertyOptional({ example: 1, description: 'Display sequence order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
