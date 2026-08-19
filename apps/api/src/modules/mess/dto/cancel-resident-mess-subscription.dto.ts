import { IsOptional, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelResidentMessSubscriptionDto {
  @ApiPropertyOptional({ description: 'Effective Cancellation Date (YYYY-MM-DD)' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'cancellationDate must be YYYY-MM-DD format' })
  public cancellationDate?: string;

  @ApiPropertyOptional({ description: 'Cancellation Reason' })
  @IsOptional()
  @IsString()
  public reason?: string;
}
