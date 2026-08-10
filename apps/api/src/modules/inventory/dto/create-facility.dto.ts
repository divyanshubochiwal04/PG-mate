import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFacilityDto {
  @ApiProperty({ example: 'High-Speed Wi-Fi', description: 'Amenity display name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'WIFI', description: 'Facility code (unique per org)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiPropertyOptional({
    example: 'UTILITY',
    enum: ['GENERAL', 'UTILITY', 'SAFETY', 'COMFORT'],
  })
  @IsOptional()
  @IsIn(['GENERAL', 'UTILITY', 'SAFETY', 'COMFORT'])
  category?: 'GENERAL' | 'UTILITY' | 'SAFETY' | 'COMFORT';

  @ApiPropertyOptional({ example: '100 Mbps fiber optic connection' })
  @IsOptional()
  @IsString()
  description?: string;
}
