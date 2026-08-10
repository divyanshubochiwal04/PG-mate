import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ example: 'raw-base64url-refresh-token-string' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
