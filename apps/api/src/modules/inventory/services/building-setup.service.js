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
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingSetupService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@m-square/database");
let BuildingSetupService = class BuildingSetupService {
    unitOfWork;
    propertyRepo;
    buildingRepo;
    floorRepo;
    roomRepo;
    bedRepo;
    facilityRepo;
    constructor(unitOfWork, propertyRepo, buildingRepo, floorRepo, roomRepo, bedRepo, facilityRepo) {
        this.unitOfWork = unitOfWork;
        this.propertyRepo = propertyRepo;
        this.buildingRepo = buildingRepo;
        this.floorRepo = floorRepo;
        this.roomRepo = roomRepo;
        this.bedRepo = bedRepo;
        this.facilityRepo = facilityRepo;
    }
    async setupBuilding(organizationId, dto) {
        // 1. Verify property exists and belongs to organization
        const property = await this.propertyRepo.findByIdForOrganization(dto.propertyId, organizationId);
        if (!property) {
            throw new common_1.NotFoundException('Property not found or access denied');
        }
        // 2. Validate Building Code uniqueness under property
        const existingBuildings = await this.buildingRepo.findAllByProperty(dto.propertyId, organizationId, {
            page: 1,
            pageSize: 100,
        });
        const codeNormalized = dto.building.code.toUpperCase().trim();
        if (existingBuildings.items.some((b) => b.code.toUpperCase() === codeNormalized)) {
            throw new common_1.ConflictException(`Building code '${dto.building.code}' already exists in this property`);
        }
        // 3. Collect & validate all facility IDs across all rooms
        const allFacilityIds = new Set();
        const roomNumbers = new Set();
        for (const floor of dto.floors) {
            if (!floor.rooms || floor.rooms.length === 0) {
                throw new common_1.BadRequestException(`Floor '${floor.name}' must contain at least one room`);
            }
            for (const room of floor.rooms) {
                const rNo = room.roomNumber.trim();
                if (roomNumbers.has(rNo)) {
                    throw new common_1.BadRequestException(`Duplicate room number '${room.roomNumber}' in setup request`);
                }
                roomNumbers.add(rNo);
                if (room.facilityIds && room.facilityIds.length > 0) {
                    for (const fid of room.facilityIds) {
                        allFacilityIds.add(fid);
                    }
                }
            }
        }
        // Validate facility tenant ownership
        if (allFacilityIds.size > 0) {
            for (const fid of Array.from(allFacilityIds)) {
                const facility = await this.facilityRepo.findByIdForOrganization(fid, organizationId);
                if (!facility) {
                    throw new common_1.NotFoundException(`Facility '${fid}' not found or belongs to another organization`);
                }
            }
        }
        // 4. Atomic Execution inside UnitOfWork Transaction
        return this.unitOfWork.runInTransaction(async (trx) => {
            // Create Building
            const buildingRow = await this.buildingRepo.createForOrganization(organizationId, {
                propertyId: dto.propertyId,
                name: dto.building.name.trim(),
                code: dto.building.code.toUpperCase().trim(),
                displayOrder: dto.building.displayOrder || 0,
            }, trx);
            let totalRoomsCreated = 0;
            let totalBedsCreated = 0;
            let totalAssignedFacilities = 0;
            const createdFloors = [];
            // Create Floors, Rooms, Beds, and Room Facilities
            for (let fIdx = 0; fIdx < dto.floors.length; fIdx++) {
                const floorConfig = dto.floors[fIdx];
                const floorRow = await this.floorRepo.createForOrganization(organizationId, {
                    buildingId: buildingRow.id,
                    name: floorConfig.name.trim(),
                    floorNumber: floorConfig.floorNumber,
                    displayOrder: floorConfig.displayOrder ?? fIdx,
                }, trx);
                createdFloors.push({
                    id: floorRow.id,
                    buildingId: floorRow.building_id,
                    organizationId: floorRow.organization_id,
                    name: floorRow.name,
                    floorNumber: floorRow.floor_number,
                    displayOrder: floorRow.display_order,
                    status: floorRow.status,
                    createdAt: floorRow.created_at.toISOString(),
                    updatedAt: floorRow.updated_at.toISOString(),
                });
                for (let rIdx = 0; rIdx < floorConfig.rooms.length; rIdx++) {
                    const roomConfig = floorConfig.rooms[rIdx];
                    const roomRow = await this.roomRepo.createForOrganization(organizationId, {
                        floorId: floorRow.id,
                        buildingId: buildingRow.id,
                        propertyId: dto.propertyId,
                        roomNumber: roomConfig.roomNumber.trim(),
                        roomType: roomConfig.roomType || 'DOUBLE',
                        capacity: roomConfig.capacity,
                        displayOrder: rIdx + 1,
                    }, trx);
                    totalRoomsCreated++;
                    // Create Beds
                    for (let bIdx = 1; bIdx <= roomConfig.capacity; bIdx++) {
                        await this.bedRepo.createForOrganization(organizationId, {
                            roomId: roomRow.id,
                            bedNumber: `Bed ${bIdx}`,
                            displayOrder: bIdx,
                            status: 'AVAILABLE',
                        }, trx);
                        totalBedsCreated++;
                    }
                    // Assign Room Facilities
                    if (roomConfig.facilityIds && roomConfig.facilityIds.length > 0) {
                        for (const fid of roomConfig.facilityIds) {
                            await this.facilityRepo.assignToRoom(roomRow.id, fid, organizationId, trx);
                            totalAssignedFacilities++;
                        }
                    }
                }
            }
            const buildingDto = {
                id: buildingRow.id,
                propertyId: buildingRow.property_id,
                organizationId: buildingRow.organization_id,
                name: buildingRow.name,
                code: buildingRow.code,
                displayOrder: buildingRow.display_order,
                status: buildingRow.status,
                createdAt: buildingRow.created_at.toISOString(),
                updatedAt: buildingRow.updated_at.toISOString(),
            };
            return {
                building: buildingDto,
                floorsCount: createdFloors.length,
                roomsCount: totalRoomsCreated,
                bedsCount: totalBedsCreated,
                assignedFacilitiesCount: totalAssignedFacilities,
                floors: createdFloors,
            };
        });
    }
};
exports.BuildingSetupService = BuildingSetupService;
exports.BuildingSetupService = BuildingSetupService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof database_1.KyselyUnitOfWork !== "undefined" && database_1.KyselyUnitOfWork) === "function" ? _a : Object, typeof (_b = typeof database_1.KyselyPropertyRepository !== "undefined" && database_1.KyselyPropertyRepository) === "function" ? _b : Object, typeof (_c = typeof database_1.KyselyBuildingRepository !== "undefined" && database_1.KyselyBuildingRepository) === "function" ? _c : Object, typeof (_d = typeof database_1.KyselyFloorRepository !== "undefined" && database_1.KyselyFloorRepository) === "function" ? _d : Object, typeof (_e = typeof database_1.KyselyRoomRepository !== "undefined" && database_1.KyselyRoomRepository) === "function" ? _e : Object, typeof (_f = typeof database_1.KyselyBedRepository !== "undefined" && database_1.KyselyBedRepository) === "function" ? _f : Object, typeof (_g = typeof database_1.KyselyFacilityRepository !== "undefined" && database_1.KyselyFacilityRepository) === "function" ? _g : Object])
], BuildingSetupService);
//# sourceMappingURL=building-setup.service.js.map