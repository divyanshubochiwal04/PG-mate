"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyBedAllocationRepository = void 0;
class KyselyBedAllocationRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    getExecutor(trx) {
        return trx && typeof trx.selectFrom === 'function'
            ? trx
            : this.db;
    }
    async findByIdForOrganization(id, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .selectFrom('bed_allocations')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    async findByIdForUpdate(id, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .selectFrom('bed_allocations')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .forUpdate()
            .executeTakeFirst();
        return row || null;
    }
    async findActiveByBed(bedId, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .selectFrom('bed_allocations')
            .selectAll()
            .where('bed_id', '=', bedId)
            .where('organization_id', '=', organizationId)
            .where('status', '=', 'ACTIVE')
            .executeTakeFirst();
        return row || null;
    }
    async findActiveByStay(stayId, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .selectFrom('bed_allocations')
            .selectAll()
            .where('stay_id', '=', stayId)
            .where('organization_id', '=', organizationId)
            .where('status', '=', 'ACTIVE')
            .executeTakeFirst();
        return row || null;
    }
    async findAllByStay(stayId, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const rows = await executor
            .selectFrom('bed_allocations')
            .selectAll()
            .where('stay_id', '=', stayId)
            .where('organization_id', '=', organizationId)
            .orderBy('start_at', 'desc')
            .execute();
        return rows;
    }
    async findCurrentLocationForResident(residentId, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .selectFrom('stays as s')
            .innerJoin('bed_allocations as ba', (join) => join.onRef('ba.stay_id', '=', 's.id').on('ba.status', '=', 'ACTIVE'))
            .innerJoin('beds as b', 'b.id', 'ba.bed_id')
            .innerJoin('rooms as r', 'r.id', 'b.room_id')
            .innerJoin('floors as f', 'f.id', 'r.floor_id')
            .innerJoin('buildings as bldg', 'bldg.id', 'f.building_id')
            .innerJoin('properties as p', 'p.id', 'bldg.property_id')
            .select([
            'p.id as propertyId',
            'p.name as propertyName',
            'bldg.id as buildingId',
            'bldg.name as buildingName',
            'f.id as floorId',
            'f.name as floorName',
            'r.id as roomId',
            'r.room_number as roomNumber',
            'b.id as bedId',
            'b.bed_number as bedNumber',
            'ba.id as allocationId',
            's.id as stayId',
        ])
            .where('s.resident_id', '=', residentId)
            .where('s.organization_id', '=', organizationId)
            .where('s.status', '=', 'ACTIVE')
            .executeTakeFirst();
        return row || null;
    }
    async createForOrganization(organizationId, data, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .insertInto('bed_allocations')
            .values({
            organization_id: organizationId,
            stay_id: data.stayId,
            bed_id: data.bedId,
            start_at: data.startAt || new Date(),
            end_at: null,
            status: data.status || 'ACTIVE',
        })
            .returningAll()
            .executeTakeFirstOrThrow();
        return row;
    }
    async endAllocation(id, organizationId, endAt, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .updateTable('bed_allocations')
            .set({
            status: 'ENDED',
            end_at: endAt || new Date(),
            updated_at: new Date(),
        })
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirst();
        return row || null;
    }
}
exports.KyselyBedAllocationRepository = KyselyBedAllocationRepository;
//# sourceMappingURL=bed-allocation.repository.js.map