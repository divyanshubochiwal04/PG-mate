"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyFacilityRepository = void 0;
const contracts_1 = require("@m-square/contracts");
class KyselyFacilityRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    getExecutor(trx) {
        return trx && typeof trx.selectFrom === 'function'
            ? trx
            : this.db;
    }
    async findByIdForOrganization(id, organizationId) {
        const row = await this.db
            .selectFrom('facilities')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    async findAllForOrganization(organizationId, params) {
        const { offset, limit } = (0, contracts_1.calculatePaginationBounds)(params.page, params.pageSize);
        const countResult = await this.db
            .selectFrom('facilities')
            .select(this.db.fn.count('id').as('total'))
            .where('organization_id', '=', organizationId)
            .executeTakeFirstOrThrow();
        const total = parseInt(countResult.total, 10);
        const rows = await this.db
            .selectFrom('facilities')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .orderBy('name', 'asc')
            .offset(offset)
            .limit(limit)
            .execute();
        return (0, contracts_1.createPaginatedResult)(rows, total, params.page, params.pageSize);
    }
    async createForOrganization(organizationId, data) {
        const row = await this.db
            .insertInto('facilities')
            .values({
            organization_id: organizationId,
            name: data.name,
            code: data.code.toUpperCase(),
            category: data.category || 'GENERAL',
            description: data.description || null,
            status: data.status || 'ACTIVE',
        })
            .returningAll()
            .executeTakeFirstOrThrow();
        return row;
    }
    async updateForOrganization(id, organizationId, data) {
        const updatePayload = {
            updated_at: new Date(),
        };
        if (data.name !== undefined)
            updatePayload['name'] = data.name;
        if (data.code !== undefined)
            updatePayload['code'] = data.code.toUpperCase();
        if (data.category !== undefined)
            updatePayload['category'] = data.category;
        if (data.description !== undefined)
            updatePayload['description'] = data.description;
        if (data.status !== undefined)
            updatePayload['status'] = data.status;
        const row = await this.db
            .updateTable('facilities')
            .set(updatePayload)
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirst();
        return row || null;
    }
    // Facility Assignments (Property, Building, Room)
    async assignToProperty(propertyId, facilityId, organizationId) {
        const res = await this.db
            .insertInto('property_facilities')
            .values({
            property_id: propertyId,
            facility_id: facilityId,
            organization_id: organizationId,
        })
            .onConflict((oc) => oc.columns(['property_id', 'facility_id']).doNothing())
            .execute();
        return Number(res.length) > 0;
    }
    async unassignFromProperty(propertyId, facilityId, organizationId) {
        const result = await this.db
            .deleteFrom('property_facilities')
            .where('property_id', '=', propertyId)
            .where('facility_id', '=', facilityId)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return Number(result.numDeletedRows) > 0;
    }
    async assignToBuilding(buildingId, facilityId, organizationId) {
        const res = await this.db
            .insertInto('building_facilities')
            .values({
            building_id: buildingId,
            facility_id: facilityId,
            organization_id: organizationId,
        })
            .onConflict((oc) => oc.columns(['building_id', 'facility_id']).doNothing())
            .execute();
        return Number(res.length) > 0;
    }
    async unassignFromBuilding(buildingId, facilityId, organizationId) {
        const result = await this.db
            .deleteFrom('building_facilities')
            .where('building_id', '=', buildingId)
            .where('facility_id', '=', facilityId)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return Number(result.numDeletedRows) > 0;
    }
    async assignToRoom(roomId, facilityId, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const res = await executor
            .insertInto('room_facilities')
            .values({
            room_id: roomId,
            facility_id: facilityId,
            organization_id: organizationId,
        })
            .onConflict((oc) => oc.columns(['room_id', 'facility_id']).doNothing())
            .execute();
        return Number(res.length) > 0;
    }
    async unassignFromRoom(roomId, facilityId, organizationId) {
        const result = await this.db
            .deleteFrom('room_facilities')
            .where('room_id', '=', roomId)
            .where('facility_id', '=', facilityId)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return Number(result.numDeletedRows) > 0;
    }
    async findAssignedToRoom(roomId, organizationId) {
        const rows = await this.db
            .selectFrom('facilities as f')
            .innerJoin('room_facilities as rf', (join) => join.onRef('rf.facility_id', '=', 'f.id').on('rf.organization_id', '=', organizationId))
            .selectAll('f')
            .where('rf.room_id', '=', roomId)
            .where('f.organization_id', '=', organizationId)
            .orderBy('f.name', 'asc')
            .execute();
        return rows;
    }
    async isFacilityAssigned(facilityId, organizationId) {
        const propRes = await this.db
            .selectFrom('property_facilities')
            .select(this.db.fn.count('facility_id').as('cnt'))
            .where('facility_id', '=', facilityId)
            .where('organization_id', '=', organizationId)
            .executeTakeFirstOrThrow();
        const bldgRes = await this.db
            .selectFrom('building_facilities')
            .select(this.db.fn.count('facility_id').as('cnt'))
            .where('facility_id', '=', facilityId)
            .where('organization_id', '=', organizationId)
            .executeTakeFirstOrThrow();
        const roomRes = await this.db
            .selectFrom('room_facilities')
            .select(this.db.fn.count('facility_id').as('cnt'))
            .where('facility_id', '=', facilityId)
            .where('organization_id', '=', organizationId)
            .executeTakeFirstOrThrow();
        return (parseInt(propRes.cnt, 10) > 0 ||
            parseInt(bldgRes.cnt, 10) > 0 ||
            parseInt(roomRes.cnt, 10) > 0);
    }
    async countFacilitiesForRoom(roomId, organizationId) {
        const res = await this.db
            .selectFrom('room_facilities')
            .select(this.db.fn.count('facility_id').as('cnt'))
            .where('room_id', '=', roomId)
            .where('organization_id', '=', organizationId)
            .executeTakeFirstOrThrow();
        return parseInt(res.cnt, 10);
    }
}
exports.KyselyFacilityRepository = KyselyFacilityRepository;
//# sourceMappingURL=facility.repository.js.map