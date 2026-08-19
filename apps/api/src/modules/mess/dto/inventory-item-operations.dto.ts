import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import type { MessInventoryStatus, MessTransactionType } from '@m-square/contracts';

export class CreateInventoryItemValidationDto {
  @ApiProperty({ description: 'Mess Facility UUID' })
  @IsUUID('4')
  @IsNotEmpty()
  public messId!: string;

  @ApiProperty({ description: 'Item Name' })
  @IsString()
  @IsNotEmpty()
  public name!: string;

  @ApiProperty({ description: 'Item Category (GRAINS, VEGETABLES, DAIRY, SPICES, OILS, etc.)' })
  @IsString()
  @IsNotEmpty()
  public category!: string;

  @ApiProperty({ description: 'Measurement Unit (kg, ltr, pcs, packet, etc.)' })
  @IsString()
  @IsNotEmpty()
  public unit!: string;

  @ApiPropertyOptional({ description: 'Initial Current Stock' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  public currentStock?: number;

  @ApiPropertyOptional({ description: 'Minimum Safety Stock' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  public minimumStock?: number;

  @ApiPropertyOptional({ description: 'Reorder Level Threshold' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  public reorderLevel?: number;
}

export class UpdateInventoryItemValidationDto {
  @ApiPropertyOptional({ description: 'Item Name' })
  @IsOptional()
  @IsString()
  public name?: string;

  @ApiPropertyOptional({ description: 'Item Category' })
  @IsOptional()
  @IsString()
  public category?: string;

  @ApiPropertyOptional({ description: 'Measurement Unit' })
  @IsOptional()
  @IsString()
  public unit?: string;

  @ApiPropertyOptional({ description: 'Minimum Safety Stock' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  public minimumStock?: number;

  @ApiPropertyOptional({ description: 'Reorder Level Threshold' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  public reorderLevel?: number;

  @ApiPropertyOptional({ description: 'Inventory Status' })
  @IsOptional()
  @IsString()
  public status?: MessInventoryStatus;
}

export class AdjustInventoryValidationDto {
  @ApiProperty({ description: 'Mess Facility UUID' })
  @IsUUID('4')
  @IsNotEmpty()
  public messId!: string;

  @ApiProperty({ description: 'Inventory Item UUID' })
  @IsUUID('4')
  @IsNotEmpty()
  public inventoryItemId!: string;

  @ApiProperty({
    description: 'Transaction Type',
    enum: ['OPENING_STOCK', 'PURCHASE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'CONSUMPTION', 'WASTAGE'],
  })
  @IsNotEmpty()
  @IsEnum(['OPENING_STOCK', 'PURCHASE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'CONSUMPTION', 'WASTAGE'])
  public transactionType!: MessTransactionType;

  @ApiProperty({ description: 'Quantity (must be greater than 0)' })
  @IsNumber()
  @IsPositive({ message: 'Quantity must be a positive number' })
  public quantity!: number;

  @ApiPropertyOptional({ description: 'Adjustment Reason / Notes' })
  @IsOptional()
  @IsString()
  public notes?: string;
}

export class InventoryQueryValidationDto {
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

  @ApiPropertyOptional({ description: 'Search term for item name or category' })
  @IsOptional()
  @IsString()
  public search?: string;

  @ApiPropertyOptional({ description: 'Category filter' })
  @IsOptional()
  @IsString()
  public category?: string;

  @ApiPropertyOptional({ description: 'Stock Status filter (IN_STOCK, LOW_STOCK, OUT_OF_STOCK)' })
  @IsOptional()
  @IsString()
  public status?: MessInventoryStatus;
}
