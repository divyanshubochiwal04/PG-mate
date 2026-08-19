import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';
import type { PaymentMethodDto } from '@m-square/contracts';

export class RecordPaymentDto {
  @ApiProperty({ description: 'Resident UUID' })
  @IsUUID('4', { message: 'residentId must be a valid UUID' })
  @IsNotEmpty({ message: 'residentId is required' })
  public residentId!: string;

  @ApiPropertyOptional({ description: 'Stay UUID' })
  @IsOptional()
  @IsUUID('4', { message: 'stayId must be a valid UUID' })
  public stayId?: string;

  @ApiPropertyOptional({ description: 'Specific Invoice UUID to collect against' })
  @IsOptional()
  @IsUUID('4', { message: 'invoiceId must be a valid UUID' })
  public invoiceId?: string;

  @ApiProperty({ description: 'Payment Amount in currency (e.g. 5000.00)' })
  @IsNumber({}, { message: 'amount must be a number' })
  @Min(0.01, { message: 'Payment amount must be greater than zero' })
  public amount!: number;

  @ApiProperty({
    description: 'Payment Method',
    enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'OTHER'],
  })
  @IsEnum(['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'OTHER'], {
    message: 'paymentMethod must be one of CASH, UPI, BANK_TRANSFER, CARD, OTHER',
  })
  public paymentMethod!: PaymentMethodDto;

  @ApiPropertyOptional({ description: 'External Reference / Transaction ID' })
  @IsOptional()
  @IsString()
  public referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Payment Date (YYYY-MM-DD)' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'paymentDate must be in YYYY-MM-DD format' })
  public paymentDate?: string;

  @ApiProperty({ description: 'Idempotency Key for payment transaction' })
  @IsString()
  @IsNotEmpty({ message: 'idempotencyKey is required' })
  public idempotencyKey!: string;

  @ApiPropertyOptional({ description: 'Payment Notes' })
  @IsOptional()
  @IsString()
  public notes?: string;
}
