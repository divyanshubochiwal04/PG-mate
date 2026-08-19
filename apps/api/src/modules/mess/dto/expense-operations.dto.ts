import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import type { MessExpenseCategory } from '@m-square/contracts';

export class CreateExpenseValidationDto {
  @ApiProperty({ description: 'Mess Facility UUID' })
  @IsUUID('4')
  @IsNotEmpty()
  public messId!: string;

  @ApiProperty({
    description: 'Expense Category',
    enum: ['GAS', 'ELECTRICITY', 'SALARY', 'CLEANING', 'TRANSPORT', 'MAINTENANCE', 'MISCELLANEOUS'],
  })
  @IsNotEmpty()
  @IsEnum(['GAS', 'ELECTRICITY', 'SALARY', 'CLEANING', 'TRANSPORT', 'MAINTENANCE', 'MISCELLANEOUS'])
  public category!: MessExpenseCategory;

  @ApiProperty({ description: 'Expense Amount (₹)' })
  @IsNumber()
  @IsPositive({ message: 'Expense amount must be a positive number' })
  public amount!: number;

  @ApiPropertyOptional({ description: 'Expense Date (YYYY-MM-DD)' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'expenseDate must be YYYY-MM-DD format' })
  public expenseDate?: string;

  @ApiPropertyOptional({ description: 'Vendor UUID' })
  @IsOptional()
  @IsUUID('4')
  public vendorId?: string;

  @ApiPropertyOptional({ description: 'Reference / Bill Number' })
  @IsOptional()
  @IsString()
  public referenceNo?: string;

  @ApiPropertyOptional({ description: 'Notes / Description' })
  @IsOptional()
  @IsString()
  public notes?: string;
}

export class ExpenseQueryValidationDto {
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

  @ApiPropertyOptional({ description: 'Search term for reference number or notes' })
  @IsOptional()
  @IsString()
  public search?: string;

  @ApiPropertyOptional({ description: 'Expense Category filter' })
  @IsOptional()
  @IsString()
  public category?: MessExpenseCategory;

  @ApiPropertyOptional({ description: 'Filter by Vendor UUID' })
  @IsOptional()
  @IsUUID('4')
  public vendorId?: string;
}
