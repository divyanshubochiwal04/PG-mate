import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProcurementItemInputValidationDto {
  @ApiProperty({ description: 'Inventory Item UUID' })
  @IsUUID('4')
  @IsNotEmpty()
  public inventoryItemId!: string;

  @ApiProperty({ description: 'Quantity purchased' })
  @IsNumber()
  @IsPositive({ message: 'Quantity must be greater than 0' })
  public quantity!: number;

  @ApiProperty({ description: 'Unit Price (₹)' })
  @IsNumber()
  @Min(0, { message: 'Unit price cannot be negative' })
  public unitPrice!: number;
}

export class CreateProcurementValidationDto {
  @ApiProperty({ description: 'Mess Facility UUID' })
  @IsUUID('4')
  @IsNotEmpty()
  public messId!: string;

  @ApiProperty({ description: 'Vendor UUID' })
  @IsUUID('4')
  @IsNotEmpty()
  public vendorId!: string;

  @ApiPropertyOptional({ description: 'Purchase Date (YYYY-MM-DD)' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'purchaseDate must be YYYY-MM-DD format' })
  public purchaseDate?: string;

  @ApiPropertyOptional({ description: 'Invoice / Bill Reference Number' })
  @IsOptional()
  @IsString()
  public invoiceReference?: string;

  @ApiPropertyOptional({ description: 'Notes / Description' })
  @IsOptional()
  @IsString()
  public notes?: string;

  @ApiProperty({ description: 'Procurement Line Items', type: [CreateProcurementItemInputValidationDto] })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateProcurementItemInputValidationDto)
  public items!: CreateProcurementItemInputValidationDto[];
}

export class ProcurementQueryValidationDto {
  @ApiProperty({ description: 'Mess Facility UUID' })
  @IsUUID('4')
  @IsNotEmpty()
  public messId!: string;

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

  @ApiPropertyOptional({ description: 'Search term for invoice reference or notes' })
  @IsOptional()
  @IsString()
  public search?: string;

  @ApiPropertyOptional({ description: 'Filter by Vendor UUID' })
  @IsOptional()
  @IsUUID('4')
  public vendorId?: string;
}
