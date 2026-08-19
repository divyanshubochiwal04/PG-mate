"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyCommercialRepository = void 0;
class KyselyCommercialRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    getExecutor(trx) {
        return trx && typeof trx.selectFrom === 'function'
            ? trx
            : this.db;
    }
    async findActiveAgreement(organizationId, stayId, trx) {
        const row = await this.getExecutor(trx)
            .selectFrom('resident_commercial_agreements')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('stay_id', '=', stayId)
            .where('status', '=', 'ACTIVE')
            .executeTakeFirst();
        return row || null;
    }
    async findAgreementHistory(organizationId, stayId, trx) {
        return this.getExecutor(trx)
            .selectFrom('resident_commercial_agreements')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('stay_id', '=', stayId)
            .orderBy('effective_date', 'desc')
            .orderBy('created_at', 'desc')
            .execute();
    }
    async findActiveFacilities(organizationId, stayId, trx) {
        const rows = await this.getExecutor(trx)
            .selectFrom('resident_facilities')
            .innerJoin('facilities', 'facilities.id', 'resident_facilities.facility_id')
            .select([
            'resident_facilities.id',
            'resident_facilities.organization_id',
            'resident_facilities.resident_id',
            'resident_facilities.stay_id',
            'resident_facilities.facility_id',
            'resident_facilities.facility_type',
            'resident_facilities.monthly_charge',
            'resident_facilities.status',
            'resident_facilities.effective_date',
            'resident_facilities.created_at',
            'resident_facilities.updated_at',
            'facilities.name as facilityName',
            'facilities.code as facilityCode',
        ])
            .where('resident_facilities.organization_id', '=', organizationId)
            .where('resident_facilities.stay_id', '=', stayId)
            .where('resident_facilities.status', '=', 'ACTIVE')
            .execute();
        return rows;
    }
    async findActiveCharges(organizationId, stayId, trx) {
        return this.getExecutor(trx)
            .selectFrom('resident_additional_charges')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('stay_id', '=', stayId)
            .where('status', '=', 'ACTIVE')
            .execute();
    }
    async createAgreement(agreement, trx) {
        const client = this.getExecutor(trx);
        return client
            .insertInto('resident_commercial_agreements')
            .values(agreement)
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    async supersedeActiveAgreement(organizationId, stayId, endDate, trx) {
        const client = this.getExecutor(trx);
        await client
            .updateTable('resident_commercial_agreements')
            .set({
            status: 'SUPERSEDED',
            end_date: endDate,
            updated_at: new Date(),
        })
            .where('organization_id', '=', organizationId)
            .where('stay_id', '=', stayId)
            .where('status', '=', 'ACTIVE')
            .execute();
    }
    async assignFacility(facility, trx) {
        const client = this.getExecutor(trx);
        return client
            .insertInto('resident_facilities')
            .values(facility)
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    async revokeFacility(organizationId, stayId, facilityId, trx) {
        const client = this.getExecutor(trx);
        const res = await client
            .updateTable('resident_facilities')
            .set({ status: 'REVOKED', updated_at: new Date() })
            .where('organization_id', '=', organizationId)
            .where('stay_id', '=', stayId)
            .where('facility_id', '=', facilityId)
            .where('status', '=', 'ACTIVE')
            .executeTakeFirst();
        return Number(res.numUpdatedRows) > 0;
    }
    async addAdditionalCharge(charge, trx) {
        const client = this.getExecutor(trx);
        return client
            .insertInto('resident_additional_charges')
            .values(charge)
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    async cancelAdditionalCharge(organizationId, stayId, chargeId, trx) {
        const client = this.getExecutor(trx);
        const res = await client
            .updateTable('resident_additional_charges')
            .set({ status: 'CANCELLED', updated_at: new Date() })
            .where('organization_id', '=', organizationId)
            .where('stay_id', '=', stayId)
            .where('id', '=', chargeId)
            .where('status', '=', 'ACTIVE')
            .executeTakeFirst();
        return Number(res.numUpdatedRows) > 0;
    }
}
exports.KyselyCommercialRepository = KyselyCommercialRepository;
//# sourceMappingURL=commercial.repository.js.map