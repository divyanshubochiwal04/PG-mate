import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import type { BuildingDto, BuildingSetupResultDto, FloorDto } from '@m-square/contracts';
import {
  dbService,
  KyselyBedRepository,
  KyselyBuildingRepository,
  KyselyFacilityRepository,
  KyselyFloorRepository,
  KyselyPropertyRepository,
  KyselyRoomRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import type { CreateBuildingSetupDto } from '../dto/create-building-setup.dto';

@Injectable()
export class BuildingSetupService {
  private readonly db = dbService.db;
  private readonly unitOfWork: KyselyUnitOfWork;
  private readonly propertyRepo: KyselyPropertyRepository;
  private readonly buildingRepo: KyselyBuildingRepository;
  private readonly floorRepo: KyselyFloorRepository;
  private readonly roomRepo: KyselyRoomRepository;
  private readonly bedRepo: KyselyBedRepository;
  private readonly facilityRepo: KyselyFacilityRepository;

  constructor(
    @Optional() unitOfWork?: KyselyUnitOfWork,
    @Optional() propertyRepo?: KyselyPropertyRepository,
    @Optional() buildingRepo?: KyselyBuildingRepository,
    @Optional() floorRepo?: KyselyFloorRepository,
    @Optional() roomRepo?: KyselyRoomRepository,
    @Optional() bedRepo?: KyselyBedRepository,
    @Optional() facilityRepo?: KyselyFacilityRepository
  ) {
    this.unitOfWork = unitOfWork ?? new KyselyUnitOfWork(this.db);
    this.propertyRepo = propertyRepo ?? new KyselyPropertyRepository(this.db);
    this.buildingRepo = buildingRepo ?? new KyselyBuildingRepository(this.db);
    this.floorRepo = floorRepo ?? new KyselyFloorRepository(this.db);
    this.roomRepo = roomRepo ?? new KyselyRoomRepository(this.db);
    this.bedRepo = bedRepo ?? new KyselyBedRepository(this.db);
    this.facilityRepo = facilityRepo ?? new KyselyFacilityRepository(this.db);
  }

  public async setupBuilding(
    organizationId: string,
    dto: CreateBuildingSetupDto
  ): Promise<BuildingSetupResultDto> {
    // 1. Verify property exists and belongs to organization
    const property = await this.propertyRepo.findByIdForOrganization(
      dto.propertyId,
      organizationId
    );
    if (!property) {
      throw new NotFoundException('Property not found or access denied');
    }

    // 2. Validate Building Code uniqueness under property
    const existingBuildings = await this.buildingRepo.findAllByProperty(
      dto.propertyId,
      organizationId,
      {
        page: 1,
        pageSize: 100,
      }
    );
    const codeNormalized = dto.building.code.toUpperCase().trim();
    if (existingBuildings.items.some((b) => b.code.toUpperCase() === codeNormalized)) {
      throw new ConflictException(
        `Building code '${dto.building.code}' already exists in this property`
      );
    }

    // 3. Collect & validate all facility IDs across all rooms
    const allFacilityIds = new Set<string>();
    const roomNumbers = new Set<string>();

    for (const floor of dto.floors) {
      if (!floor.rooms || floor.rooms.length === 0) {
        throw new BadRequestException(`Floor '${floor.name}' must contain at least one room`);
      }
      for (const room of floor.rooms) {
        const rNo = room.roomNumber.trim();
        if (roomNumbers.has(rNo)) {
          throw new BadRequestException(
            `Duplicate room number '${room.roomNumber}' in setup request`
          );
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
          throw new NotFoundException(
            `Facility '${fid}' not found or belongs to another organization`
          );
        }
      }
    }

    // 4. Atomic Execution inside UnitOfWork Transaction
    return this.unitOfWork.runInTransaction(async (trx) => {
      // Create Building
      const buildingRow = await this.buildingRepo.createForOrganization(
        organizationId,
        {
          propertyId: dto.propertyId,
          name: dto.building.name.trim(),
          code: dto.building.code.toUpperCase().trim(),
          displayOrder: dto.building.displayOrder || 0,
        },
        trx
      );

      let totalRoomsCreated = 0;
      let totalBedsCreated = 0;
      let totalAssignedFacilities = 0;
      const createdFloors: FloorDto[] = [];

      // Create Floors, Rooms, Beds, and Room Facilities
      for (let fIdx = 0; fIdx < dto.floors.length; fIdx++) {
        const floorConfig = dto.floors[fIdx];
        const floorRow = await this.floorRepo.createForOrganization(
          organizationId,
          {
            buildingId: buildingRow.id,
            name: floorConfig.name.trim(),
            floorNumber: floorConfig.floorNumber,
            displayOrder: floorConfig.displayOrder ?? fIdx,
          },
          trx
        );

        createdFloors.push({
          id: floorRow.id,
          buildingId: floorRow.building_id,
          organizationId: floorRow.organization_id,
          name: floorRow.name,
          floorNumber: floorRow.floor_number,
          displayOrder: floorRow.display_order,
          status: floorRow.status as 'ACTIVE' | 'INACTIVE',
          createdAt: floorRow.created_at.toISOString(),
          updatedAt: floorRow.updated_at.toISOString(),
        });

        for (let rIdx = 0; rIdx < floorConfig.rooms.length; rIdx++) {
          const roomConfig = floorConfig.rooms[rIdx];
          const roomRow = await this.roomRepo.createForOrganization(
            organizationId,
            {
              floorId: floorRow.id,
              buildingId: buildingRow.id,
              propertyId: dto.propertyId,
              roomNumber: roomConfig.roomNumber.trim(),
              roomType: roomConfig.roomType || 'DOUBLE',
              capacity: roomConfig.capacity,
              displayOrder: rIdx + 1,
            },
            trx
          );
          totalRoomsCreated++;

          // Create Beds
          for (let bIdx = 1; bIdx <= roomConfig.capacity; bIdx++) {
            await this.bedRepo.createForOrganization(
              organizationId,
              {
                roomId: roomRow.id,
                bedNumber: `Bed ${bIdx}`,
                displayOrder: bIdx,
                status: 'AVAILABLE',
              },
              trx
            );
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

      const buildingDto: BuildingDto = {
        id: buildingRow.id,
        propertyId: buildingRow.property_id,
        organizationId: buildingRow.organization_id,
        name: buildingRow.name,
        code: buildingRow.code,
        displayOrder: buildingRow.display_order,
        status: buildingRow.status as 'ACTIVE' | 'INACTIVE',
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
}
