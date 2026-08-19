"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBuildingSetupDto = exports.FloorSetupItemDto = exports.RoomSetupItemDto = exports.BuildingInfoConfigDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class BuildingInfoConfigDto {
    name;
    code;
    displayOrder;
}
exports.BuildingInfoConfigDto = BuildingInfoConfigDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Block A', description: 'Building display name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], BuildingInfoConfigDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'BLK-A', description: 'Building code (unique per property)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], BuildingInfoConfigDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, description: 'Display sequence order' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], BuildingInfoConfigDto.prototype, "displayOrder", void 0);
class RoomSetupItemDto {
    roomNumber;
    roomType;
    capacity;
    facilityIds;
}
exports.RoomSetupItemDto = RoomSetupItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '101', description: 'Room number identifier' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], RoomSetupItemDto.prototype, "roomNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'DOUBLE', enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_BED', 'DORMITORY', 'CUSTOM'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_BED', 'DORMITORY', 'CUSTOM']),
    __metadata("design:type", String)
], RoomSetupItemDto.prototype, "roomType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2, description: 'Bed capacity' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RoomSetupItemDto.prototype, "capacity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['facility-uuid-1'], description: 'Facility IDs to assign to this room' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], RoomSetupItemDto.prototype, "facilityIds", void 0);
class FloorSetupItemDto {
    name;
    floorNumber;
    displayOrder;
    rooms;
}
exports.FloorSetupItemDto = FloorSetupItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Ground Floor', description: 'Floor display name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], FloorSetupItemDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Numeric floor level (0=Ground, 1=First...)' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], FloorSetupItemDto.prototype, "floorNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0, description: 'Display order' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], FloorSetupItemDto.prototype, "displayOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [RoomSetupItemDto], description: 'Rooms configuration for this floor' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RoomSetupItemDto),
    __metadata("design:type", Array)
], FloorSetupItemDto.prototype, "rooms", void 0);
class CreateBuildingSetupDto {
    propertyId;
    building;
    floors;
}
exports.CreateBuildingSetupDto = CreateBuildingSetupDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'property-uuid-1', description: 'Target property ID' }),
    (0, class_validator_1.IsUUID)('4'),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateBuildingSetupDto.prototype, "propertyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: BuildingInfoConfigDto, description: 'Building header metadata' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => BuildingInfoConfigDto),
    __metadata("design:type", BuildingInfoConfigDto)
], CreateBuildingSetupDto.prototype, "building", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FloorSetupItemDto], description: 'Floors configuration array' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FloorSetupItemDto),
    __metadata("design:type", Array)
], CreateBuildingSetupDto.prototype, "floors", void 0);
//# sourceMappingURL=create-building-setup.dto.js.map