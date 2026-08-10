import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateBedDto {
  @ApiProperty({ example: 'Bed A', description: 'Bed label (unique per room)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  bedNumber!: string;

  @ApiPropertyOptional({ example: 1, description: 'Display sequence order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
