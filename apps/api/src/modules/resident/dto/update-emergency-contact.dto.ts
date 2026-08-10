import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import type { EmergencyRelationship } from '@m-square/contracts';

export class UpdateEmergencyContactDto {
  @ApiPropertyOptional({ example: 'Robert Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ enum: ['PARENT', 'GUARDIAN', 'SIBLING', 'SPOUSE', 'FRIEND', 'OTHER'] })
  @IsOptional()
  @IsIn(['PARENT', 'GUARDIAN', 'SIBLING', 'SPOUSE', 'FRIEND', 'OTHER'])
  relationship?: EmergencyRelationship;

  @ApiPropertyOptional({ example: '+919876543219' })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'phone must be valid E.164 format' })
  phone?: string;

  @ApiPropertyOptional({ example: '+919876543218' })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'alternatePhone must be valid E.164 format' })
  alternatePhone?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
