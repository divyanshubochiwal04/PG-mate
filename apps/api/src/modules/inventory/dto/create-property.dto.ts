import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePropertyDto {
  @ApiProperty({ example: 'M Square Green Glen', description: 'Display name of property' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'PROP-01', description: 'Property code (unique per org)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({ example: '123 Tech Park Road', description: 'Primary street address' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  addressLine1!: string;

  @ApiPropertyOptional({ example: 'Suite 400', description: 'Secondary address details' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @ApiProperty({ example: 'Bellandur', description: 'Locality/Area name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  locality!: string;

  @ApiProperty({ example: 'Bengaluru', description: 'City name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @ApiProperty({ example: 'Karnataka', description: 'State name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state!: string;

  @ApiProperty({ example: '560103', description: 'PIN/ZIP Postal code' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  postalCode!: string;
}
