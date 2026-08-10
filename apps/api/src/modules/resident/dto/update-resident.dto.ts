import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import type { Gender, ResidentStatus } from '@m-square/contracts';

export class UpdateResidentDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Kumar' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: 'Johnny' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  preferredName?: string;

  @ApiPropertyOptional({ example: '2000-01-15' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateOfBirth must be YYYY-MM-DD format' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] })
  @IsOptional()
  @IsIn(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
  gender?: Gender;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'phone must be valid E.164 format' })
  phone?: string;

  @ApiPropertyOptional({ example: '+919876543211' })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'alternatePhone must be valid E.164 format' })
  alternatePhone?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: '123 Main Street' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine1?: string;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'Karnataka' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ example: '560103' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: ResidentStatus;
}
