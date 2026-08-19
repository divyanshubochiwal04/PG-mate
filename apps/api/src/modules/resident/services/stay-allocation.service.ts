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
  KyselyCommercialRepository,
  KyselyFloorRepository,
  KyselyMessRepository,
  KyselyNotificationRepository,
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
import type { CheckInCommercialDto } from '../../commercial/dto/check-in-commercial.dto';

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
  private readonly commercialRepo = new KyselyCommercialRepository(this.db);
  private readonly messRepo = new KyselyMessRepository(this.db);
  private readonly notificationRepo = new KyselyNotificationRepository(this.db);
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

        // Mark bed as OCCUPIED atomically
        await this.bedRepo.updateStatus(dto.bedId, organizationId, 'OCCUPIED', trx);

        await this.notificationRepo.createIfNotExists(
          organizationId,
          {
            type: 'RESIDENT_CHECKED_IN',
            severity: 'INFO',
            title: 'Resident Checked In',
            message: `${resident.first_name} ${resident.last_name} checked in successfully.`,
            entity_type: 'RESIDENT',
            entity_id: resident.id,
            action_route: `/(owner)/residents/${resident.id}`,
            metadata: { stayId: stayRow.id, bedId: dto.bedId, residentCode: resident.resident_code },
            dedupe_key: `RESIDENT_CHECKED_IN:${stayRow.id}`,
            status: 'UNREAD',
            read_at: null,
            resolved_at: null,
            expires_at: null,
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

      if (currentAlloc.bed_id === dto.targetBedId) {
        throw new BadRequestException('Target bed must be different from current bed');
      }

      // 🔒 Lock stay row FOR UPDATE to enforce deterministic lock ordering
      const stay = await this.stayRepo.findByIdForUpdate(currentAlloc.stay_id, organizationId, trx);
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
      if (targetBed.status === 'MAINTENANCE') {
        throw new BadRequestException('Target bed is under maintenance');
      }
      if (targetBed.status === 'OCCUPIED') {
        throw new ConflictException('Target bed is already occupied by an active allocation');
      }
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
      await this.bedRepo.updateStatus(currentAlloc.bed_id, organizationId, 'AVAILABLE', trx);

      const newAlloc = await this.allocationRepo.createForOrganization(
        organizationId,
        {
          stayId: currentAlloc.stay_id,
          bedId: dto.targetBedId,
          startAt: new Date(),
        },
        trx
      );
      await this.bedRepo.updateStatus(dto.targetBedId, organizationId, 'OCCUPIED', trx);

      await this.notificationRepo.createIfNotExists(
        organizationId,
        {
          type: 'RESIDENT_TRANSFERRED',
          severity: 'INFO',
          title: 'Resident Transferred',
          message: `Resident transferred to new bed allocation.`,
          entity_type: 'RESIDENT',
          entity_id: stay.resident_id,
          action_route: `/(owner)/residents/${stay.resident_id}`,
          metadata: { allocationId: newAlloc.id, stayId: stay.id, oldBedId: currentAlloc.bed_id, newBedId: dto.targetBedId },
          dedupe_key: `RESIDENT_TRANSFERRED:${newAlloc.id}`,
          status: 'UNREAD',
          read_at: null,
          resolved_at: null,
          expires_at: null,
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

      const resident = await this.residentRepo.findByIdForOrganization(stay.resident_id, organizationId, trx);
      if (!resident) {
        throw new NotFoundException('Resident not found');
      }

      const checkoutDate = dto.actualCheckoutDate ? new Date(dto.actualCheckoutDate) : new Date();
      const dateStr = checkoutDate.toISOString().split('T')[0];

      // Find and end active allocation for this stay
      const activeAlloc = await this.allocationRepo.findActiveByStay(stayId, organizationId, trx);
      if (activeAlloc) {
        await this.bedRepo.findByIdForUpdate(activeAlloc.bed_id, organizationId, trx);
        await this.allocationRepo.endAllocation(activeAlloc.id, organizationId, checkoutDate, trx);
        await this.bedRepo.updateStatus(activeAlloc.bed_id, organizationId, 'AVAILABLE', trx);
      }

      await this.commercialRepo.supersedeActiveAgreement(organizationId, stayId, dateStr, trx);
      await this.messRepo.endActiveSubscription(organizationId, stayId, dateStr, trx);

      const completedStay = await this.stayRepo.completeStay(
        stayId,
        organizationId,
        checkoutDate,
        dto.notes || undefined,
        trx
      );

      if (!completedStay) throw new NotFoundException('Stay not found');

      await this.notificationRepo.createIfNotExists(
        organizationId,
        {
          type: 'RESIDENT_CHECKED_OUT',
          severity: 'INFO',
          title: 'Resident Checked Out',
          message: `${resident.first_name} ${resident.last_name} completed checkout.`,
          entity_type: 'RESIDENT',
          entity_id: resident.id,
          action_route: `/(owner)/residents/${resident.id}`,
          metadata: { stayId: completedStay.id, checkoutDate: dateStr },
          dedupe_key: `RESIDENT_CHECKED_OUT:${completedStay.id}`,
          status: 'UNREAD',
          read_at: null,
          resolved_at: null,
          expires_at: null,
        },
        trx
      );

      return this.mapStayRow(completedStay);
    });
  }

  public async checkOutResident(
    organizationId: string,
    residentId: string,
    dto: CheckOutDto
  ): Promise<StayDto> {
    const resident = await this.residentRepo.findByIdForOrganization(residentId, organizationId);
    if (!resident) {
      throw new NotFoundException('Resident not found');
    }
    const stay = await this.stayRepo.findActiveByResident(residentId, organizationId);
    if (!stay) {
      throw new BadRequestException('Resident has no active stay to check out');
    }
    return this.checkOut(organizationId, stay.id, dto);
  }

  // --- ATOMIC CHECK-IN WITH COMMERCIAL TERMS ---
  public async checkInCommercial(
    organizationId: string,
    dto: CheckInCommercialDto
  ): Promise<{ stay: StayDto; allocation: BedAllocationDto }> {
    return await this.unitOfWork.runInTransaction(async (trx) => {
      const { stay, allocation } = await this.checkIn(organizationId, {
        residentId: dto.residentId,
        bedId: dto.bedId,
        admissionDate: dto.admissionDate,
        notes: dto.notes,
      });

      const admissionDate = dto.admissionDate || new Date().toISOString().split('T')[0];

      await this.commercialRepo.createAgreement(
        {
          organization_id: organizationId,
          resident_id: dto.residentId,
          stay_id: stay.id,
          base_rent_amount: dto.baseRentAmount,
          security_deposit_amount: dto.securityDepositAmount ?? 0,
          security_deposit_status: 'PENDING',
          billing_cycle: dto.billingCycle || 'JOINING_DATE',
          effective_date: admissionDate,
          end_date: null,
          status: 'ACTIVE',
        },
        trx
      );

      if (dto.facilityIds && dto.facilityIds.length > 0) {
        for (const facilityId of dto.facilityIds) {
          await this.commercialRepo.assignFacility(
            {
              organization_id: organizationId,
              resident_id: dto.residentId,
              stay_id: stay.id,
              facility_id: facilityId,
              facility_type: 'INCLUDED',
              monthly_charge: 0,
              status: 'ACTIVE',
              effective_date: admissionDate,
            },
            trx
          );
        }
      }

      if (dto.additionalCharges && dto.additionalCharges.length > 0) {
        for (const charge of dto.additionalCharges) {
          await this.commercialRepo.addAdditionalCharge(
            {
              organization_id: organizationId,
              resident_id: dto.residentId,
              stay_id: stay.id,
              agreement_id: null,
              charge_type: charge.chargeType,
              description: charge.description,
              amount: charge.amount,
              is_recurring: charge.isRecurring ?? true,
              effective_date: charge.effectiveDate || admissionDate,
              status: 'ACTIVE',
            },
            trx
          );
        }
      }

      if (dto.messSubscription?.messId && dto.messSubscription?.mealPlanId) {
        const plan = await this.messRepo.findMealPlanById(
          dto.messSubscription.mealPlanId,
          organizationId,
          trx
        );
        await this.messRepo.createSubscription(
          {
            organization_id: organizationId,
            resident_id: dto.residentId,
            stay_id: stay.id,
            mess_id: dto.messSubscription.messId,
            meal_plan_id: dto.messSubscription.mealPlanId,
            billing_mode: plan?.billing_mode || 'MONTHLY',
            price_at_subscription: plan ? Number(plan.price) : 0,
            status: 'ACTIVE',
            start_date: admissionDate,
            end_date: null,
          },
          trx
        );
      }

      return { stay, allocation };
    });
  }

  // --- READ & UPDATE METHODS ---
  public async getActiveStays(organizationId: string): Promise<StayDto[]> {
    const rows = await this.stayRepo.findActiveStaysByOrganization(organizationId);
    return rows.map((r) => this.mapStayRow(r));
  }

  public async updateStay(
    id: string,
    organizationId: string,
    dto: { expectedCheckoutDate?: string; notes?: string }
  ): Promise<StayDto> {
    const row = await this.stayRepo.updateForOrganization(id, organizationId, {
      expectedCheckoutDate: dto.expectedCheckoutDate
        ? new Date(dto.expectedCheckoutDate)
        : undefined,
      notes: dto.notes,
    });
    if (!row) throw new NotFoundException('Stay not found');
    return this.mapStayRow(row);
  }

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
