import { ApiProperty } from '@nestjs/swagger';

export class HealthChecksDto {
  @ApiProperty({ example: 'ok' })
  application!: string;

  @ApiProperty({ example: 'ok' })
  database!: string;
}

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok' | 'error';

  @ApiProperty({ type: HealthChecksDto })
  checks!: HealthChecksDto;
}
