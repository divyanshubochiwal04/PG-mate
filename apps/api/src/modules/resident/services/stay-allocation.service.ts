import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  dbService,
  KyselyBedAllocationRepository,
  KyselyBedRepository,
  KyselyBuildingRepository,
  KyselyFloorRepository,
  KyselyPropertyRepository,
  KyselyResidentRepository,
  KyselyRoomRepository,
  KyselyStayRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import type { BedAllocationRow, StayRow } from '@m-square/database';
import type { BedAllocationDto, StayDto } from '@m-square/contracts';
import type { CheckInDto } from '../dto/check-in.dto';
import type { TransferDto } from '../dto/transfer.dto';
import type { CheckOutDto } from '../dto/check-out.dto';

@Injectable()
export class StayAllocationService {
  private readonly db = dbService.db;
  private readonly residentRepo = new KyselyResidentRepository(this.db);
  private readonly stayRepo = new KyselyStayRepository(this.db);
  private readonly allocationRepo = new KyselyBedAllocationRepository(this.db);
  private readonly bedRepo = new KyselyBedRepository(this.db);
  private readonly roomRepo = new KyselyRoomRepository(this.db);
  private readonly floorRepo = new KyselyFloorRepository(this.db);
  private readonly buildingRepo = new KyselyBuildingRepository(this.db);
  private readonly propertyRepo = new KyselyPropertyRepository(this.db);
  private readonly unitOfWork = new KyselyUnitOfWork(this.db);

  // --- CHECK-IN WORKFLOW ---
  public async checkIn(
    organizationId: string,
    dto: CheckInDto
  ): Promise<{ stay: StayDto; allocation: BedAllocationDto }> {
    return await this.unitOfWork.runInTransaction(async (trx) => {
      // 🔒 1. Lock resident row FIRST (Global Lock Ordering Hierarchy)
      const resident = await this.residentRepo.findByIdForUpdate(
        dto.residentId,
        organizationId,
        trx
      );
      if (!resident) throw new NotFoundException('Resident not found');
      if (resident.status !== 'ACTIVE') {
        throw new BadRequestException('Cannot check in an inactive resident');
      }

      // Check active stay for resident
      const activeStay = await this.stayRepo.findActiveByResident(
        dto.residentId,
        organizationId,
        trx
      );
      if (activeStay) {
        throw new ConflictException('Resident already has an active stay');
      }

      // 🔒 2. Lock bed row SECOND
      const bed = await this.bedRepo.findByIdForUpdate(dto.bedId, organizationId, trx);
      if (!bed) throw new NotFoundException('Bed not found');
      if (bed.status !== 'AVAILABLE') {
        throw new BadRequestException(`Bed is not available for check-in (Status: ${bed.status})`);
      }

      // Validate physical hierarchy status === 'ACTIVE'
      const room = await this.roomRepo.findByIdForOrganization(bed.room_id, organizationId);
      if (!room || room.status !== 'ACTIVE') throw new BadRequestException('Room is not active');

      const floor = await this.floorRepo.findByIdForOrganization(room.floor_id, organizationId);
      if (!floor || floor.status !== 'ACTIVE') throw new BadRequestException('Floor is not active');

      const building = await this.buildingRepo.findByIdForOrganization(
        floor.building_id,
        organizationId
      );
      if (!building || building.status !== 'ACTIVE')
        throw new BadRequestException('Building is not active');

      const property = await this.propertyRepo.findByIdForOrganization(
        building.property_id,
        organizationId
      );
      if (!property || property.status !== 'ACTIVE')
        throw new BadRequestException('Property is not active');

      // Check active allocation for bed
      const activeAllocation = await this.allocationRepo.findActiveByBed(
        dto.bedId,
        organizationId,
        trx
      );
      if (activeAllocation) {
        throw new ConflictException('Bed is already occupied by an active allocation');
      }

      // 3. Create Stay & Allocation atomically
      try {
        const stayRow = await this.stayRepo.createForOrganization(
          organizationId,
          {
            residentId: dto.residentId,
            admissionDate: dto.admissionDate ? new Date(dto.admissionDate) : undefined,
            expectedCheckoutDate: dto.expectedCheckoutDate
              ? new Date(dto.expectedCheckoutDate)
              : null,
            notes: dto.notes,
          },
          trx
        );

        const allocRow = await this.allocationRepo.createForOrganization(
          organizationId,
          {
            stayId: stayRow.id,
            bedId: dto.bedId,
            startAt: stayRow.admission_date,
          },
          trx
        );

        return {
          stay: this.mapStayRow(stayRow),
          allocation: this.mapAllocationRow(allocRow),
        };
      } catch (err: unknown) {
        if ((err as { code?: string }).code === '23505') {
          throw new ConflictException(
            'Concurrency conflict: Active stay or bed allocation already exists'
          );
        }
        throw err;
      }
    });
  }

  // --- TRANSFER WORKFLOW ---
  public async transfer(
    organizationId: string,
    allocationId: string,
    dto: TransferDto
  ): Promise<BedAllocationDto> {
    return await this.unitOfWork.runInTransaction(async (trx) => {
      const currentAlloc = await this.allocationRepo.findByIdForUpdate(
        allocationId,
        organizationId,
        trx
      );
      if (!currentAlloc) throw new NotFoundException('Current bed allocation not found');
      if (currentAlloc.status !== 'ACTIVE') {
        throw new BadRequestException('Cannot transfer an inactive or ended allocation');
      }

      // 🔒 Lock stay row FOR UPDATE to enforce deterministic lock ordering
      const stay = await this.stayRepo.findByIdForUpdate(
        currentAlloc.stay_id,
        organizationId,
        trx
      );
      if (!stay || stay.status !== 'ACTIVE') {
        throw new BadRequestException('Stay associated with allocation is no longer active');
      }

      // 🔒 Lock beds in ascending UUID lexicographical order to prevent deadlocks (P2-4)
      const sortedBedIds = [currentAlloc.bed_id, dto.targetBedId].sort();
      const beds = await Promise.all(
        sortedBedIds.map((id) => this.bedRepo.findByIdForUpdate(id, organizationId, trx))
      );

      const targetBed = beds.find((b) => b?.id === dto.targetBedId);
      if (!targetBed) throw new NotFoundException('Target bed not found');
      if (targetBed.status !== 'AVAILABLE') {
        throw new BadRequestException(
          `Target bed is not available for transfer (Status: ${targetBed.status})`
        );
      }

      // Check active allocation on target bed
      const targetBedActiveAlloc = await this.allocationRepo.findActiveByBed(
        dto.targetBedId,
        organizationId,
        trx
      );
      if (targetBedActiveAlloc) {
        throw new ConflictException('Target bed is already occupied by an active allocation');
      }

      // Atomically close old allocation & create new allocation
      await this.allocationRepo.endAllocation(allocationId, organizationId, new Date(), trx);

      const newAlloc = await this.allocationRepo.createForOrganization(
        organizationId,
        {
          stayId: currentAlloc.stay_id,
          bedId: dto.targetBedId,
          startAt: new Date(),
        },
        trx
      );

      return this.mapAllocationRow(newAlloc);
    });
  }

  // --- CHECKOUT WORKFLOW ---
  public async checkOut(
    organizationId: string,
    stayId: string,
    dto: CheckOutDto
  ): Promise<StayDto> {
    return await this.unitOfWork.runInTransaction(async (trx) => {
      const stay = await this.stayRepo.findByIdForUpdate(stayId, organizationId, trx);
      if (!stay) throw new NotFoundException('Stay not found');
      if (stay.status !== 'ACTIVE') {
        throw new BadRequestException('Stay is not active and cannot be checked out');
      }

      // Find and end active allocation for this stay
      const activeAlloc = await this.allocationRepo.findActiveByStay(stayId, organizationId, trx);
      if (activeAlloc) {
        await this.allocationRepo.endAllocation(activeAlloc.id, organizationId, new Date(), trx);
      }

      const checkoutDate = dto.actualCheckoutDate ? new Date(dto.actualCheckoutDate) : new Date();
      const completedStay = await this.stayRepo.completeStay(
        stayId,
        organizationId,
        checkoutDate,
        dto.notes || undefined,
        trx
      );

      if (!completedStay) throw new NotFoundException('Stay not found');
      return this.mapStayRow(completedStay);
    });
  }

  // --- READ METHODS ---
  public async getStayById(id: string, organizationId: string): Promise<StayDto> {
    const row = await this.stayRepo.findByIdForOrganization(id, organizationId);
    if (!row) throw new NotFoundException('Stay not found');
    return this.mapStayRow(row);
  }

  public async getAllocationById(id: string, organizationId: string): Promise<BedAllocationDto> {
    const row = await this.allocationRepo.findByIdForOrganization(id, organizationId);
    if (!row) throw new NotFoundException('Allocation not found');
    return this.mapAllocationRow(row);
  }

  // --- MAPPERS ---
  private mapStayRow(r: StayRow): StayDto {
    return {
      id: r.id,
      organizationId: r.organization_id,
      residentId: r.resident_id,
      admissionDate: r.admission_date.toISOString().split('T')[0],
      expectedCheckoutDate: r.expected_checkout_date
        ? r.expected_checkout_date.toISOString().split('T')[0]
        : null,
      actualCheckoutDate: r.actual_checkout_date
        ? r.actual_checkout_date.toISOString().split('T')[0]
        : null,
      status: r.status as StayDto['status'],
      notes: r.notes,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    };
  }

  private mapAllocationRow(r: BedAllocationRow): BedAllocationDto {
    return {
      id: r.id,
      organizationId: r.organization_id,
      stayId: r.stay_id,
      bedId: r.bed_id,
      startAt: r.start_at.toISOString(),
      endAt: r.end_at ? r.end_at.toISOString() : null,
      status: r.status as BedAllocationDto['status'],
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    };
  }
}
