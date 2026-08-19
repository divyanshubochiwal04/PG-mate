import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import type { MessVendorStatus } from '@m-square/contracts';

export class CreateVendorValidationDto {
  @ApiProperty({ description: 'Vendor Name' })
  @IsString()
  @IsNotEmpty()
  public name!: string;

  @ApiPropertyOptional({ description: 'Phone Number' })
  @IsOptional()
  @IsString()
  public phone?: string;

  @ApiPropertyOptional({ description: 'Email Address' })
  @IsOptional()
  @IsEmail({}, { message: 'email must be a valid email address' })
  public email?: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsOptional()
  @IsString()
  public address?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  public notes?: string;
}

export class UpdateVendorValidationDto {
  @ApiPropertyOptional({ description: 'Vendor Name' })
  @IsOptional()
  @IsString()
  public name?: string;

  @ApiPropertyOptional({ description: 'Phone Number' })
  @IsOptional()
  @IsString()
  public phone?: string;

  @ApiPropertyOptional({ description: 'Email Address' })
  @IsOptional()
  @IsEmail({}, { message: 'email must be a valid email address' })
  public email?: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsOptional()
  @IsString()
  public address?: string;

  @ApiPropertyOptional({ description: 'Status (ACTIVE, INACTIVE)' })
  @IsOptional()
  @IsString()
  public status?: MessVendorStatus;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  public notes?: string;
}

export class VendorQueryValidationDto {
  @ApiPropertyOptional({ description: 'Page Number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public page?: number = 1;

  @ApiPropertyOptional({ description: 'Page Size', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public pageSize?: number = 20;

  @ApiPropertyOptional({ description: 'Search term for name, phone, or email' })
  @IsOptional()
  @IsString()
  public search?: string;

  @ApiPropertyOptional({ description: 'Status filter (ACTIVE, INACTIVE)' })
  @IsOptional()
  @IsString()
  public status?: MessVendorStatus;
}
