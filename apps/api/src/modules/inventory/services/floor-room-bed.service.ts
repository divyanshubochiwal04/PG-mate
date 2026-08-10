import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  dbService,
  KyselyBedRepository,
  KyselyBuildingRepository,
  KyselyFloorRepository,
  KyselyRoomRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import type { BedRow, FloorRow, RoomRow } from '@m-square/database';
import type {
  BedDto,
  FloorDto,
  PaginatedResult,
  PaginationParams,
  RoomDto,
} from '@m-square/contracts';
import type { CreateFloorDto } from '../dto/create-floor.dto';
import type { CreateRoomDto } from '../dto/create-room.dto';
import type { UpdateCapacityDto } from '../dto/update-capacity.dto';
import type { CreateBedDto } from '../dto/create-bed.dto';
import type { UpdateBedStatusDto } from '../dto/update-bed-status.dto';

@Injectable()
export class FloorRoomBedService {
  private readonly db = dbService.db;
  private readonly buildingRepo = new KyselyBuildingRepository(this.db);
  private readonly floorRepo = new KyselyFloorRepository(this.db);
  private readonly roomRepo = new KyselyRoomRepository(this.db);
  private readonly bedRepo = new KyselyBedRepository(this.db);
  private readonly unitOfWork = new KyselyUnitOfWork(this.db);

  // --- FLOORS ---
  public async createFloor(
    buildingId: string,
    organizationId: string,
    dto: CreateFloorDto
  ): Promise<FloorDto> {
    const building = await this.buildingRepo.findByIdForOrganization(buildingId, organizationId);
    if (!building) throw new NotFoundException('Building not found');
    if (building.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot create floor under an inactive building');
    }

    try {
      const row = await this.floorRepo.createForOrganization(organizationId, {
        buildingId,
        name: dto.name,
        floorNumber: dto.floorNumber,
        displayOrder: dto.displayOrder,
      });

      return this.mapFloorRow(row);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === '23505') {
        throw new ConflictException(
          `Floor number ${dto.floorNumber} already exists in this building`
        );
      }
      throw err;
    }
  }

  public async getFloors(
    buildingId: string,
    organizationId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<FloorDto>> {
    const building = await this.buildingRepo.findByIdForOrganization(buildingId, organizationId);
    if (!building) throw new NotFoundException('Building not found');

    const res = await this.floorRepo.findAllByBuilding(buildingId, organizationId, params);
    return {
      ...res,
      items: res.items.map((r) => this.mapFloorRow(r)),
    };
  }

  public async getFloorById(id: string, organizationId: string): Promise<FloorDto> {
    const row = await this.floorRepo.findByIdForOrganization(id, organizationId);
    if (!row) throw new NotFoundException('Floor not found');
    return this.mapFloorRow(row);
  }

  // --- ROOMS ---
  public async createRoom(
    floorId: string,
    organizationId: string,
    dto: CreateRoomDto
  ): Promise<RoomDto> {
    const floor = await this.floorRepo.findByIdForOrganization(floorId, organizationId);
    if (!floor) throw new NotFoundException('Floor not found');
    if (floor.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot create room under an inactive floor');
    }

    const building = await this.buildingRepo.findByIdForOrganization(
      floor.building_id,
      organizationId
    );
    if (!building) throw new NotFoundException('Building not found');

    try {
      const row = await this.roomRepo.createForOrganization(organizationId, {
        floorId,
        buildingId: building.id,
        propertyId: building.property_id,
        roomNumber: dto.roomNumber,
        roomType: dto.roomType,
        capacity: dto.capacity,
        displayOrder: dto.displayOrder,
      });

      return this.mapRoomRow(row);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === '23505') {
        throw new ConflictException(`Room number '${dto.roomNumber}' already exists on this floor`);
      }
      throw err;
    }
  }

  public async getRooms(
    floorId: string,
    organizationId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<RoomDto>> {
    const floor = await this.floorRepo.findByIdForOrganization(floorId, organizationId);
    if (!floor) throw new NotFoundException('Floor not found');

    const res = await this.roomRepo.findAllByFloor(floorId, organizationId, params);
    return {
      ...res,
      items: res.items.map((r) => this.mapRoomRow(r)),
    };
  }

  public async getRoomById(id: string, organizationId: string): Promise<RoomDto> {
    const row = await this.roomRepo.findByIdForOrganization(id, organizationId);
    if (!row) throw new NotFoundException('Room not found');
    return this.mapRoomRow(row);
  }

  public async updateRoomCapacity(
    roomId: string,
    organizationId: string,
    dto: UpdateCapacityDto
  ): Promise<RoomDto> {
    return await this.unitOfWork.runInTransaction(async (trx) => {
      const room = await this.roomRepo.findByIdForUpdate(roomId, organizationId, trx);
      if (!room) throw new NotFoundException('Room not found');

      const activeBeds = await this.bedRepo.countActiveBedsInRoom(roomId, organizationId, trx);
      if (dto.capacity < activeBeds) {
        throw new BadRequestException(
          `Cannot reduce capacity to ${dto.capacity} below active bed count of ${activeBeds}`
        );
      }

      const updated = await this.roomRepo.updateCapacity(roomId, organizationId, dto.capacity, trx);
      if (!updated) throw new NotFoundException('Room not found');
      return this.mapRoomRow(updated);
    });
  }

  // --- BEDS ---
  public async createBed(
    roomId: string,
    organizationId: string,
    dto: CreateBedDto
  ): Promise<BedDto> {
    return await this.unitOfWork.runInTransaction(async (trx) => {
      const room = await this.roomRepo.findByIdForUpdate(roomId, organizationId, trx);
      if (!room) throw new NotFoundException('Room not found');
      if (room.status !== 'ACTIVE') {
        throw new BadRequestException('Cannot create bed under an inactive room');
      }

      const activeBeds = await this.bedRepo.countActiveBedsInRoom(roomId, organizationId, trx);
      if (activeBeds >= room.capacity) {
        throw new BadRequestException(
          `Room capacity limit reached (${activeBeds}/${room.capacity})`
        );
      }

      try {
        const row = await this.bedRepo.createForOrganization(
          organizationId,
          {
            roomId,
            bedNumber: dto.bedNumber,
            displayOrder: dto.displayOrder,
          },
          trx
        );

        return this.mapBedRow(row);
      } catch (err: unknown) {
        if ((err as { code?: string }).code === '23505') {
          throw new ConflictException(`Bed '${dto.bedNumber}' already exists in this room`);
        }
        throw err;
      }
    });
  }

  public async getBeds(
    roomId: string,
    organizationId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<BedDto>> {
    const room = await this.roomRepo.findByIdForOrganization(roomId, organizationId);
    if (!room) throw new NotFoundException('Room not found');

    const res = await this.bedRepo.findAllByRoom(roomId, organizationId, params);
    return {
      ...res,
      items: res.items.map((r) => this.mapBedRow(r)),
    };
  }

  public async updateBedStatus(
    id: string,
    organizationId: string,
    dto: UpdateBedStatusDto
  ): Promise<BedDto> {
    return await this.unitOfWork.runInTransaction(async (trx) => {
      const bed = await this.bedRepo.findByIdForOrganization(id, organizationId, trx);
      if (!bed) throw new NotFoundException('Bed not found');

      const room = await this.roomRepo.findByIdForUpdate(bed.room_id, organizationId, trx);
      if (!room) throw new NotFoundException('Room not found');

      if (
        bed.status === 'INACTIVE' &&
        (dto.status === 'AVAILABLE' || dto.status === 'MAINTENANCE')
      ) {
        const activeBeds = await this.bedRepo.countActiveBedsInRoom(
          bed.room_id,
          organizationId,
          trx
        );
        if (activeBeds >= room.capacity) {
          throw new BadRequestException(
            `Cannot reactivate bed: Room capacity limit reached (${activeBeds}/${room.capacity})`
          );
        }
      }

      const updated = await this.bedRepo.updateStatus(id, organizationId, dto.status, trx);
      if (!updated) throw new NotFoundException('Bed not found');
      return this.mapBedRow(updated);
    });
  }

  // --- MAPPERS ---
  private mapFloorRow(r: FloorRow): FloorDto {
    return {
      id: r.id,
      buildingId: r.building_id,
      organizationId: r.organization_id,
      name: r.name,
      floorNumber: r.floor_number,
      displayOrder: r.display_order,
      status: r.status as 'ACTIVE' | 'INACTIVE',
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    };
  }

  private mapRoomRow(r: RoomRow): RoomDto {
    return {
      id: r.id,
      floorId: r.floor_id,
      buildingId: r.building_id,
      propertyId: r.property_id,
      organizationId: r.organization_id,
      roomNumber: r.room_number,
      roomType: r.room_type as RoomDto['roomType'],
      capacity: r.capacity,
      displayOrder: r.display_order,
      status: r.status as RoomDto['status'],
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    };
  }

  private mapBedRow(r: BedRow): BedDto {
    return {
      id: r.id,
      roomId: r.room_id,
      organizationId: r.organization_id,
      bedNumber: r.bed_number,
      displayOrder: r.display_order,
      status: r.status as BedDto['status'],
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    };
  }
}
