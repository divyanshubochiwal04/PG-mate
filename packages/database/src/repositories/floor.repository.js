"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyFloorRepository = void 0;
const contracts_1 = require("@m-square/contracts");
class KyselyFloorRepository {
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
            .selectFrom('floors')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    async findAllByBuilding(buildingId, organizationId, params) {
        const { offset, limit } = (0, contracts_1.calculatePaginationBounds)(params.page, params.pageSize);
        const countResult = await this.db
            .selectFrom('floors')
            .select(this.db.fn.count('id').as('total'))
            .where('building_id', '=', buildingId)
            .where('organization_id', '=', organizationId)
            .executeTakeFirstOrThrow();
        const total = parseInt(countResult.total, 10);
        const rows = await this.db
            .selectFrom('floors')
            .selectAll()
            .where('building_id', '=', buildingId)
            .where('organization_id', '=', organizationId)
            .orderBy('floor_number', 'asc')
            .orderBy('display_order', 'asc')
            .offset(offset)
            .limit(limit)
            .execute();
        return (0, contracts_1.createPaginatedResult)(rows, total, params.page, params.pageSize);
    }
    async createForOrganization(organizationId, data, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .insertInto('floors')
            .values({
            building_id: data.buildingId,
            organization_id: organizationId,
            name: data.name,
            floor_number: data.floorNumber,
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
        if (data.floorNumber !== undefined)
            updatePayload['floor_number'] = data.floorNumber;
        if (data.displayOrder !== undefined)
            updatePayload['display_order'] = data.displayOrder;
        if (data.status !== undefined)
            updatePayload['status'] = data.status;
        const row = await this.db
            .updateTable('floors')
            .set(updatePayload)
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirst();
        return row || null;
    }
    async deleteForOrganization(id, organizationId) {
        const result = await this.db
            .deleteFrom('floors')
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return Number(result.numDeletedRows) > 0;
    }
    async countRoomsInFloor(floorId, organizationId) {
        const res = await this.db
            .selectFrom('rooms')
            .select(this.db.fn.count('id').as('cnt'))
            .where('floor_id', '=', floorId)
            .where('organization_id', '=', organizationId)
            .executeTakeFirstOrThrow();
        return parseInt(res.cnt, 10);
    }
}
exports.KyselyFloorRepository = KyselyFloorRepository;
//# sourceMappingURL=floor.repository.js.map