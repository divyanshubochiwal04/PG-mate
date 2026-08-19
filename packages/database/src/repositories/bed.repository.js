"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyBedRepository = void 0;
const contracts_1 = require("@m-square/contracts");
class KyselyBedRepository {
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
            .selectFrom('beds')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    async findByIdForUpdate(id, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .selectFrom('beds')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .forUpdate()
            .executeTakeFirst();
        return row || null;
    }
    async findAllByRoom(roomId, organizationId, params) {
        const { offset, limit } = (0, contracts_1.calculatePaginationBounds)(params.page, params.pageSize);
        const countResult = await this.db
            .selectFrom('beds')
            .select(this.db.fn.count('id').as('total'))
            .where('room_id', '=', roomId)
            .where('organization_id', '=', organizationId)
            .executeTakeFirstOrThrow();
        const total = parseInt(countResult.total, 10);
        const rows = await this.db
            .selectFrom('beds')
            .selectAll()
            .where('room_id', '=', roomId)
            .where('organization_id', '=', organizationId)
            .orderBy('display_order', 'asc')
            .orderBy('bed_number', 'asc')
            .offset(offset)
            .limit(limit)
            .execute();
        return (0, contracts_1.createPaginatedResult)(rows, total, params.page, params.pageSize);
    }
    /**
     * Count active beds in room (AVAILABLE or MAINTENANCE).
     * Used in capacity calculations under room FOR UPDATE lock.
     */
    async countActiveBedsInRoom(roomId, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const res = await executor
            .selectFrom('beds')
            .select(this.db.fn.count('id').as('cnt'))
            .where('room_id', '=', roomId)
            .where('organization_id', '=', organizationId)
            .where('status', 'in', ['AVAILABLE', 'MAINTENANCE'])
            .executeTakeFirstOrThrow();
        return parseInt(res.cnt, 10);
    }
    async createForOrganization(organizationId, data, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .insertInto('beds')
            .values({
            room_id: data.roomId,
            organization_id: organizationId,
            bed_number: data.bedNumber,
            display_order: data.displayOrder || 0,
            status: data.status || 'AVAILABLE',
        })
            .returningAll()
            .executeTakeFirstOrThrow();
        return row;
    }
    async updateStatus(id, organizationId, status, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .updateTable('beds')
            .set({
            status,
            updated_at: new Date(),
        })
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirst();
        return row || null;
    }
    async updateForOrganization(id, organizationId, data, trx) {
        const executor = this.getExecutor(trx);
        const updatePayload = {
            updated_at: new Date(),
        };
        if (data.bedNumber !== undefined)
            updatePayload['bed_number'] = data.bedNumber;
        if (data.displayOrder !== undefined)
            updatePayload['display_order'] = data.displayOrder;
        if (data.status !== undefined)
            updatePayload['status'] = data.status;
        const row = await executor
            .updateTable('beds')
            .set(updatePayload)
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirst();
        return row || null;
    }
    async deleteForOrganization(id, organizationId) {
        const result = await this.db
            .deleteFrom('beds')
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return Number(result.numDeletedRows) > 0;
    }
}
exports.KyselyBedRepository = KyselyBedRepository;
//# sourceMappingURL=bed.repository.js.map