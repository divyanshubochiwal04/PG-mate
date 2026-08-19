import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class BuildingInfoConfigDto {
  @ApiProperty({ example: 'Block A', description: 'Building display name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'BLK-A', description: 'Building code (unique per property)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiPropertyOptional({ example: 1, description: 'Display sequence order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class RoomSetupItemDto {
  @ApiProperty({ example: '101', description: 'Room number identifier' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  roomNumber!: string;

  @ApiPropertyOptional({
    example: 'DOUBLE',
    enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_BED', 'DORMITORY', 'CUSTOM'],
  })
  @IsOptional()
  @IsEnum(['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_BED', 'DORMITORY', 'CUSTOM'])
  roomType?: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR_BED' | 'DORMITORY' | 'CUSTOM';

  @ApiProperty({ example: 2, description: 'Bed capacity' })
  @IsInt()
  @Min(1)
  capacity!: number;

  @ApiPropertyOptional({
    example: ['facility-uuid-1'],
    description: 'Facility IDs to assign to this room',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  facilityIds?: string[];
}

export class FloorSetupItemDto {
  @ApiProperty({ example: 'Ground Floor', description: 'Floor display name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 0, description: 'Numeric floor level (0=Ground, 1=First...)' })
  @IsInt()
  floorNumber!: number;

  @ApiPropertyOptional({ example: 0, description: 'Display order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiProperty({ type: [RoomSetupItemDto], description: 'Rooms configuration for this floor' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RoomSetupItemDto)
  rooms!: RoomSetupItemDto[];
}

export class CreateBuildingSetupDto {
  @ApiProperty({ example: 'property-uuid-1', description: 'Target property ID' })
  @IsUUID('4')
  @IsNotEmpty()
  propertyId!: string;

  @ApiProperty({ type: BuildingInfoConfigDto, description: 'Building header metadata' })
  @ValidateNested()
  @Type(() => BuildingInfoConfigDto)
  building!: BuildingInfoConfigDto;

  @ApiProperty({ type: [FloorSetupItemDto], description: 'Floors configuration array' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FloorSetupItemDto)
  floors!: FloorSetupItemDto[];
}
