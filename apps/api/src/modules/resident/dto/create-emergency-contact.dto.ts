import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import type { EmergencyRelationship } from '@m-square/contracts';

export class CreateEmergencyContactDto {
  @ApiProperty({ example: 'Robert Doe', description: 'Emergency contact name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    example: 'PARENT',
    enum: ['PARENT', 'GUARDIAN', 'SIBLING', 'SPOUSE', 'FRIEND', 'OTHER'],
  })
  @IsIn(['PARENT', 'GUARDIAN', 'SIBLING', 'SPOUSE', 'FRIEND', 'OTHER'])
  relationship!: EmergencyRelationship;

  @ApiProperty({ example: '+919876543219', description: 'Emergency contact phone (E.164)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'phone must be valid E.164 format' })
  phone!: string;

  @ApiPropertyOptional({ example: '+919876543218' })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'alternatePhone must be valid E.164 format' })
  alternatePhone?: string;

  @ApiPropertyOptional({ example: true, description: 'Set as primary contact' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
