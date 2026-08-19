import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateResidentMessSubscriptionDto {
  @ApiProperty({ description: 'Mess Facility UUID' })
  @IsUUID('4', { message: 'messId must be a valid UUID' })
  @IsNotEmpty()
  public messId!: string;

  @ApiProperty({ description: 'Meal Plan UUID' })
  @IsUUID('4', { message: 'mealPlanId must be a valid UUID' })
  @IsNotEmpty()
  public mealPlanId!: string;

  @ApiPropertyOptional({ description: 'Effective Start Date (YYYY-MM-DD)' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'startDate must be YYYY-MM-DD format' })
  public startDate?: string;

  @ApiPropertyOptional({ description: 'Subscription Notes' })
  @IsOptional()
  @IsString()
  public notes?: string;
}
