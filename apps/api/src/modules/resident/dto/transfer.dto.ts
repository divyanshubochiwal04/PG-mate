import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class TransferDto {
  @ApiProperty({ example: 'uuid-target-bed-id', description: 'Target bed UUID for transfer' })
  @IsUUID()
  @IsNotEmpty()
  targetBedId!: string;
}
