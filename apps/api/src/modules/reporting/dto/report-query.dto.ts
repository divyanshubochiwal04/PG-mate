import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Matches, Max, Min } from 'class-validator';

export class ReportQueryDto {
  @IsOptional()
  @IsUUID('4')
  propertyId?: string;

  @IsOptional()
  @IsUUID('4')
  buildingId?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fromDate must be in YYYY-MM-DD format' })
  fromDate?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'toDate must be in YYYY-MM-DD format' })
  toDate?: string;

  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'billingPeriod must be in YYYY-MM format' })
  billingPeriod?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;
}
