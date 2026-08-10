import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  dbService,
  KyselyBedAllocationRepository,
  KyselyEmergencyContactRepository,
  KyselyOrganizationCounterRepository,
  KyselyResidentRepository,
  KyselyStayRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import type { EmergencyContactRow, ResidentRow } from '@m-square/database';
import type {
  EmergencyContactDto,
  PaginatedResult,
  PaginationParams,
  ResidentDto,
  ResidentHistoryDto,
} from '@m-square/contracts';
import type { CreateResidentDto } from '../dto/create-resident.dto';
import type { UpdateResidentDto } from '../dto/update-resident.dto';

@Injectable()
export class ResidentService {
  private readonly db = dbService.db;
  private readonly residentRepo = new KyselyResidentRepository(this.db);
  private readonly contactRepo = new KyselyEmergencyContactRepository(this.db);
  private readonly counterRepo = new KyselyOrganizationCounterRepository(this.db);
  private readonly stayRepo = new KyselyStayRepository(this.db);
  private readonly allocationRepo = new KyselyBedAllocationRepository(this.db);
  private readonly unitOfWork = new KyselyUnitOfWork(this.db);

  public async createResident(
    organizationId: string,
    dto: CreateResidentDto
  ): Promise<ResidentDto> {
    try {
      const nextSeq = await this.counterRepo.getNextValueForUpdate(organizationId, 'RESIDENT');
      const residentCode = `RES-${String(nextSeq).padStart(6, '0')}`;

      const row = await this.residentRepo.createForOrganization(organizationId, {
        residentCode,
        firstName: dto.firstName,
        middleName: dto.middleName,
        lastName: dto.lastName,
        preferredName: dto.preferredName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        gender: dto.gender,
        phone: dto.phone,
        alternatePhone: dto.alternatePhone,
        email: dto.email ? dto.email.toLowerCase().trim() : null,
        addressLine1: dto.addressLine1,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
      });

      return this.mapResidentRow(row);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === '23505') {
        throw new ConflictException('Resident code conflict');
      }
      throw err;
    }
  }

  public async getResidents(
    organizationId: string,
    params: PaginationParams,
    search?: string,
    status?: string
  ): Promise<PaginatedResult<ResidentDto>> {
    const res = await this.residentRepo.findAllForOrganization(
      organizationId,
      params,
      search,
      status
    );

    const items = await Promise.all(
      res.items.map(async (r) => {
        const primaryContact = await this.contactRepo.findPrimaryByResident(r.id, organizationId);
        const currentLocation = await this.allocationRepo.findCurrentLocationForResident(
          r.id,
          organizationId
        );
        return this.mapResidentRow(
          r,
          primaryContact ? this.mapContactRow(primaryContact) : null,
          currentLocation
        );
      })
    );

    return { ...res, items };
  }

  public async getResidentById(id: string, organizationId: string): Promise<ResidentDto> {
    const row = await this.residentRepo.findByIdForOrganization(id, organizationId);
    if (!row) throw new NotFoundException('Resident not found');

    const primaryContact = await this.contactRepo.findPrimaryByResident(id, organizationId);
    const currentLocation = await this.allocationRepo.findCurrentLocationForResident(
      id,
      organizationId
    );

    return this.mapResidentRow(
      row,
      primaryContact ? this.mapContactRow(primaryContact) : null,
      currentLocation
    );
  }

  public async updateResident(
    id: string,
    organizationId: string,
    dto: UpdateResidentDto
  ): Promise<ResidentDto> {
    return await this.unitOfWork.runInTransaction(async (trx) => {
      // 🔒 1. Lock resident row FOR UPDATE first
      const resident = await this.residentRepo.findByIdForUpdate(id, organizationId, trx);
      if (!resident) throw new NotFoundException('Resident not found');

      // 🔒 2. Verify active stay when setting status = INACTIVE
      if (dto.status === 'INACTIVE') {
        const activeStay = await this.stayRepo.findActiveByResident(id, organizationId, trx);
        if (activeStay) {
          throw new BadRequestException(
            'Cannot deactivate a resident with an active stay or bed allocation. Perform checkout first.'
          );
        }
      }

      const row = await this.residentRepo.updateForOrganization(
        id,
        organizationId,
        {
          firstName: dto.firstName,
          middleName: dto.middleName,
          lastName: dto.lastName,
          preferredName: dto.preferredName,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          gender: dto.gender,
          phone: dto.phone,
          alternatePhone: dto.alternatePhone,
          email: dto.email ? dto.email.toLowerCase().trim() : undefined,
          addressLine1: dto.addressLine1,
          city: dto.city,
          state: dto.state,
          postalCode: dto.postalCode,
          status: dto.status,
        },
        trx
      );

      if (!row) throw new NotFoundException('Resident not found');
      return this.mapResidentRow(row);
    });
  }

  public async getResidentHistory(
    id: string,
    organizationId: string
  ): Promise<ResidentHistoryDto> {
    const resident = await this.getResidentById(id, organizationId);
    const stays = await this.stayRepo.findAllByResident(id, organizationId);

    const allocations = (
      await Promise.all(
        stays.map((s) => this.allocationRepo.findAllByStay(s.id, organizationId))
      )
    ).flat();

    return {
      resident,
      stays: stays.map((s) => ({
        id: s.id,
        organizationId: s.organization_id,
        residentId: s.resident_id,
        admissionDate: s.admission_date.toISOString().split('T')[0],
        expectedCheckoutDate: s.expected_checkout_date
          ? s.expected_checkout_date.toISOString().split('T')[0]
          : null,
        actualCheckoutDate: s.actual_checkout_date
          ? s.actual_checkout_date.toISOString().split('T')[0]
          : null,
        status: s.status as 'ACTIVE' | 'COMPLETED' | 'CANCELLED',
        notes: s.notes,
        createdAt: s.created_at.toISOString(),
        updatedAt: s.updated_at.toISOString(),
      })),
      allocations: allocations.map((a) => ({
        id: a.id,
        organizationId: a.organization_id,
        stayId: a.stay_id,
        bedId: a.bed_id,
        startAt: a.start_at.toISOString(),
        endAt: a.end_at ? a.end_at.toISOString() : null,
        status: a.status as 'ACTIVE' | 'ENDED' | 'CANCELLED',
        createdAt: a.created_at.toISOString(),
        updatedAt: a.updated_at.toISOString(),
      })),
    };
  }

  private mapResidentRow(
    r: ResidentRow,
    primaryContact?: EmergencyContactDto | null,
    currentLocation?: ResidentDto['currentLocation'] | null
  ): ResidentDto {
    return {
      id: r.id,
      organizationId: r.organization_id,
      residentCode: r.resident_code,
      firstName: r.first_name,
      middleName: r.middle_name,
      lastName: r.last_name,
      preferredName: r.preferred_name,
      dateOfBirth: r.date_of_birth ? r.date_of_birth.toISOString().split('T')[0] : null,
      gender: r.gender as ResidentDto['gender'],
      phone: r.phone,
      alternatePhone: r.alternate_phone,
      email: r.email,
      addressLine1: r.address_line1,
      city: r.city,
      state: r.state,
      postalCode: r.postal_code,
      status: r.status as ResidentDto['status'],
      primaryEmergencyContact: primaryContact || null,
      currentLocation: currentLocation || null,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    };
  }

  private mapContactRow(c: EmergencyContactRow): EmergencyContactDto {
    return {
      id: c.id,
      residentId: c.resident_id,
      organizationId: c.organization_id,
      name: c.name,
      relationship: c.relationship as EmergencyContactDto['relationship'],
      phone: c.phone,
      alternatePhone: c.alternate_phone,
      isPrimary: c.is_primary,
      createdAt: c.created_at.toISOString(),
      updatedAt: c.updated_at.toISOString(),
    };
  }
}
