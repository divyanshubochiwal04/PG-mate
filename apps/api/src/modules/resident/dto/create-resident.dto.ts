import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import type { Gender } from '@m-square/contracts';

export class CreateResidentDto {
  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @ApiPropertyOptional({ example: 'Kumar', description: 'Middle name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional({ example: 'Johnny', description: 'Preferred display name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  preferredName?: string;

  @ApiPropertyOptional({ example: '2000-01-15', description: 'Date of birth (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateOfBirth must be YYYY-MM-DD format' })
  dateOfBirth?: string;

  @ApiProperty({
    example: 'MALE',
    enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
    description: 'Gender',
  })
  @IsIn(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
  gender!: Gender;

  @ApiProperty({ example: '+919876543210', description: 'Primary phone (E.164 format)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'phone must be valid E.164 format (e.g. +919876543210)' })
  phone!: string;

  @ApiPropertyOptional({ example: '+919876543211', description: 'Alternate phone' })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'alternatePhone must be valid E.164 format' })
  alternatePhone?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com', description: 'Email address' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: '123 Main Street', description: 'Street address' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine1?: string;

  @ApiPropertyOptional({ example: 'Bengaluru', description: 'City' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Karnataka', description: 'State' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ example: '560103', description: 'Postal Code' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;
}
