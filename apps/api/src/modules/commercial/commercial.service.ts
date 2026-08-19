import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  dbService,
  KyselyCommercialRepository,
  KyselyFacilityRepository,
  KyselyResidentRepository,
  KyselyStayRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import type {
  AdditionalChargeDto,
  CommercialAgreementDto,
  ResidentCommercialSummaryDto,
  ResidentFacilityDto,
} from '@m-square/contracts';
import type { CreateCommercialAgreementDto } from './dto/create-commercial-agreement.dto';
import type { AssignResidentFacilityDto } from './dto/assign-resident-facility.dto';
import type { CreateAdditionalChargeDto } from './dto/create-additional-charge.dto';

@Injectable()
export class CommercialService {
  private readonly db = dbService.db;
  private readonly commercialRepo = new KyselyCommercialRepository(this.db);
  private readonly residentRepo = new KyselyResidentRepository(this.db);
  private readonly stayRepo = new KyselyStayRepository(this.db);
  private readonly facilityRepo = new KyselyFacilityRepository(this.db);
  private readonly unitOfWork = new KyselyUnitOfWork(this.db);

  public async getCommercialSummary(
    organizationId: string,
    residentId: string
  ): Promise<ResidentCommercialSummaryDto> {
    await this.verifyResidentExists(organizationId, residentId);
    const activeStay = await this.stayRepo.findActiveByResident(residentId, organizationId);
    if (!activeStay) {
      return { agreement: null, facilities: [], additionalCharges: [], totalMonthlyAmount: 0 };
    }

    const agreementRow = await this.commercialRepo.findActiveAgreement(
      organizationId,
      activeStay.id
    );
    const facilityRows = await this.commercialRepo.findActiveFacilities(
      organizationId,
      activeStay.id
    );
    const chargeRows = await this.commercialRepo.findActiveCharges(organizationId, activeStay.id);

    const agreement: CommercialAgreementDto | null = agreementRow
      ? {
          id: agreementRow.id,
          organizationId: agreementRow.organization_id,
          residentId: agreementRow.resident_id,
          stayId: agreementRow.stay_id,
          baseRentAmount: Number(agreementRow.base_rent_amount),
          securityDepositAmount: Number(agreementRow.security_deposit_amount),
          securityDepositStatus: agreementRow.security_deposit_status,
          billingCycle: agreementRow.billing_cycle,
          effectiveDate: agreementRow.effective_date,
          endDate: agreementRow.end_date,
          status: agreementRow.status,
          createdAt: new Date(agreementRow.created_at).toISOString(),
        }
      : null;

    const facilities: ResidentFacilityDto[] = facilityRows.map((f) => ({
      id: f.id,
      organizationId: f.organization_id,
      residentId: f.resident_id,
      stayId: f.stay_id,
      facilityId: f.facility_id,
      facilityName: f.facilityName,
      facilityCode: f.facilityCode,
      facilityType: f.facility_type,
      monthlyCharge: Number(f.monthly_charge),
      status: f.status,
      effectiveDate: f.effective_date,
      createdAt: new Date(f.created_at).toISOString(),
    }));

    const additionalCharges: AdditionalChargeDto[] = chargeRows.map((c) => ({
      id: c.id,
      organizationId: c.organization_id,
      residentId: c.resident_id,
      stayId: c.stay_id,
      agreementId: c.agreement_id,
      chargeType: c.charge_type,
      description: c.description,
      amount: Number(c.amount),
      isRecurring: c.is_recurring,
      effectiveDate: c.effective_date,
      status: c.status,
      createdAt: new Date(c.created_at).toISOString(),
    }));

    const rent = agreement ? agreement.baseRentAmount : 0;
    const facilitiesTotal = facilities.reduce((sum, f) => sum + f.monthlyCharge, 0);
    const chargesTotal = additionalCharges
      .filter((c) => c.isRecurring)
      .reduce((sum, c) => sum + c.amount, 0);

    return {
      agreement,
      facilities,
      additionalCharges,
      totalMonthlyAmount: Number((rent + facilitiesTotal + chargesTotal).toFixed(2)),
    };
  }

  public async getCommercialHistory(
    organizationId: string,
    residentId: string
  ): Promise<CommercialAgreementDto[]> {
    await this.verifyResidentExists(organizationId, residentId);
    const stays = await this.stayRepo.findAllByResident(residentId, organizationId);
    if (stays.length === 0) return [];

    const allAgreements: CommercialAgreementDto[] = [];
    for (const stay of stays) {
      const rows = await this.commercialRepo.findAgreementHistory(organizationId, stay.id);
      rows.forEach((r) => {
        allAgreements.push({
          id: r.id,
          organizationId: r.organization_id,
          residentId: r.resident_id,
          stayId: r.stay_id,
          baseRentAmount: Number(r.base_rent_amount),
          securityDepositAmount: Number(r.security_deposit_amount),
          securityDepositStatus: r.security_deposit_status,
          billingCycle: r.billing_cycle,
          effectiveDate: r.effective_date,
          endDate: r.end_date,
          status: r.status,
          createdAt: new Date(r.created_at).toISOString(),
        });
      });
    }

    return allAgreements;
  }

  public async createAgreementRevision(
    organizationId: string,
    residentId: string,
    dto: CreateCommercialAgreementDto
  ): Promise<CommercialAgreementDto> {
    await this.verifyResidentExists(organizationId, residentId);
    const activeStay = await this.getActiveStayOrThrow(organizationId, residentId);

    const effectiveDate = dto.effectiveDate || new Date().toISOString().split('T')[0];

    return this.unitOfWork.runInTransaction(async (trx) => {
      await this.commercialRepo.supersedeActiveAgreement(
        organizationId,
        activeStay.id,
        effectiveDate,
        trx
      );

      const created = await this.commercialRepo.createAgreement(
        {
          organization_id: organizationId,
          resident_id: residentId,
          stay_id: activeStay.id,
          base_rent_amount: dto.baseRentAmount,
          security_deposit_amount: dto.securityDepositAmount ?? 0,
          security_deposit_status: 'PENDING',
          billing_cycle: dto.billingCycle || 'JOINING_DATE',
          effective_date: effectiveDate,
          end_date: null,
          status: 'ACTIVE',
        },
        trx
      );

      return {
        id: created.id,
        organizationId: created.organization_id,
        residentId: created.resident_id,
        stayId: created.stay_id,
        baseRentAmount: Number(created.base_rent_amount),
        securityDepositAmount: Number(created.security_deposit_amount),
        securityDepositStatus: created.security_deposit_status,
        billingCycle: created.billing_cycle,
        effectiveDate: created.effective_date,
        endDate: created.end_date,
        status: created.status,
        createdAt: new Date(created.created_at).toISOString(),
      };
    });
  }

  public async assignResidentFacility(
    organizationId: string,
    residentId: string,
    dto: AssignResidentFacilityDto
  ): Promise<ResidentFacilityDto> {
    await this.verifyResidentExists(organizationId, residentId);
    const activeStay = await this.getActiveStayOrThrow(organizationId, residentId);

    const catalogFacility = await this.facilityRepo.findByIdForOrganization(
      dto.facilityId,
      organizationId
    );
    if (!catalogFacility) {
      throw new NotFoundException(`Facility with ID '${dto.facilityId}' not found.`);
    }

    const existingActive = await this.commercialRepo.findActiveFacilities(
      organizationId,
      activeStay.id
    );
    if (existingActive.some((f) => f.facility_id === dto.facilityId)) {
      throw new ConflictException(
        `Facility with ID '${dto.facilityId}' is already assigned to this resident.`
      );
    }

    const effectiveDate = dto.effectiveDate || new Date().toISOString().split('T')[0];

    const row = await this.commercialRepo.assignFacility({
      organization_id: organizationId,
      resident_id: residentId,
      stay_id: activeStay.id,
      facility_id: dto.facilityId,
      facility_type: dto.facilityType || 'INCLUDED',
      monthly_charge: dto.monthlyCharge ?? 0,
      status: 'ACTIVE',
      effective_date: effectiveDate,
    });

    return {
      id: row.id,
      organizationId: row.organization_id,
      residentId: row.resident_id,
      stayId: row.stay_id,
      facilityId: row.facility_id,
      facilityName: catalogFacility.name,
      facilityCode: catalogFacility.code,
      facilityType: row.facility_type,
      monthlyCharge: Number(row.monthly_charge),
      status: row.status,
      effectiveDate: row.effective_date,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  public async revokeResidentFacility(
    organizationId: string,
    residentId: string,
    facilityId: string
  ): Promise<boolean> {
    await this.verifyResidentExists(organizationId, residentId);
    const activeStay = await this.getActiveStayOrThrow(organizationId, residentId);
    const success = await this.commercialRepo.revokeFacility(
      organizationId,
      activeStay.id,
      facilityId
    );
    if (!success) {
      throw new NotFoundException(
        `Active facility assignment not found for facility '${facilityId}'.`
      );
    }
    return true;
  }

  public async addAdditionalCharge(
    organizationId: string,
    residentId: string,
    dto: CreateAdditionalChargeDto
  ): Promise<AdditionalChargeDto> {
    await this.verifyResidentExists(organizationId, residentId);
    const activeStay = await this.getActiveStayOrThrow(organizationId, residentId);
    const activeAgreement = await this.commercialRepo.findActiveAgreement(
      organizationId,
      activeStay.id
    );

    const effectiveDate = dto.effectiveDate || new Date().toISOString().split('T')[0];

    const row = await this.commercialRepo.addAdditionalCharge({
      organization_id: organizationId,
      resident_id: residentId,
      stay_id: activeStay.id,
      agreement_id: activeAgreement ? activeAgreement.id : null,
      charge_type: dto.chargeType,
      description: dto.description,
      amount: dto.amount,
      is_recurring: dto.isRecurring ?? true,
      effective_date: effectiveDate,
      status: 'ACTIVE',
    });

    return {
      id: row.id,
      organizationId: row.organization_id,
      residentId: row.resident_id,
      stayId: row.stay_id,
      agreementId: row.agreement_id,
      chargeType: row.charge_type,
      description: row.description,
      amount: Number(row.amount),
      isRecurring: row.is_recurring,
      effectiveDate: row.effective_date,
      status: row.status,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  public async cancelAdditionalCharge(
    organizationId: string,
    residentId: string,
    chargeId: string
  ): Promise<boolean> {
    await this.verifyResidentExists(organizationId, residentId);
    const activeStay = await this.getActiveStayOrThrow(organizationId, residentId);
    const success = await this.commercialRepo.cancelAdditionalCharge(
      organizationId,
      activeStay.id,
      chargeId
    );
    if (!success) {
      throw new NotFoundException(`Active charge with ID '${chargeId}' not found.`);
    }
    return true;
  }

  private async verifyResidentExists(organizationId: string, residentId: string): Promise<void> {
    const resident = await this.residentRepo.findByIdForOrganization(residentId, organizationId);
    if (!resident) {
      throw new NotFoundException(`Resident with ID '${residentId}' not found.`);
    }
  }

  private async getActiveStayOrThrow(organizationId: string, residentId: string) {
    const activeStay = await this.stayRepo.findActiveByResident(residentId, organizationId);
    if (!activeStay) {
      throw new BadRequestException(`Resident '${residentId}' does not have an active stay.`);
    }
    return activeStay;
  }
}
