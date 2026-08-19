"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyBuildingRepository = void 0;
const contracts_1 = require("@m-square/contracts");
class KyselyBuildingRepository {
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
            .selectFrom('buildings')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    async findAllByProperty(propertyId, organizationId, params) {
        const { offset, limit } = (0, contracts_1.calculatePaginationBounds)(params.page, params.pageSize);
        const countResult = await this.db
            .selectFrom('buildings')
            .select(this.db.fn.count('id').as('total'))
            .where('property_id', '=', propertyId)
            .where('organization_id', '=', organizationId)
            .executeTakeFirstOrThrow();
        const total = parseInt(countResult.total, 10);
        const rows = await this.db
            .selectFrom('buildings')
            .selectAll()
            .where('property_id', '=', propertyId)
            .where('organization_id', '=', organizationId)
            .orderBy('display_order', 'asc')
            .orderBy('created_at', 'desc')
            .offset(offset)
            .limit(limit)
            .execute();
        return (0, contracts_1.createPaginatedResult)(rows, total, params.page, params.pageSize);
    }
    async createForOrganization(organizationId, data, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .insertInto('buildings')
            .values({
            property_id: data.propertyId,
            organization_id: organizationId,
            name: data.name,
            code: data.code.toUpperCase(),
            display_order: data.displayOrder || 0,
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
        if (data.displayOrder !== undefined)
            updatePayload['display_order'] = data.displayOrder;
        if (data.status !== undefined)
            updatePayload['status'] = data.status;
        const row = await this.db
            .updateTable('buildings')
            .set(updatePayload)
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirst();
        return row || null;
    }
    async deleteForOrganization(id, organizationId) {
        const result = await this.db
            .deleteFrom('buildings')
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return Number(result.numDeletedRows) > 0;
    }
    async countFloorsInBuilding(buildingId, organizationId) {
        const res = await this.db
            .selectFrom('floors')
            .select(this.db.fn.count('id').as('cnt'))
            .where('building_id', '=', buildingId)
            .where('organization_id', '=', organizationId)
            .executeTakeFirstOrThrow();
        return parseInt(res.cnt, 10);
    }
}
exports.KyselyBuildingRepository = KyselyBuildingRepository;
//# sourceMappingURL=building.repository.js.map