"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyStayRepository = void 0;
class KyselyStayRepository {
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
            .selectFrom('stays')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    async findByIdForUpdate(id, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .selectFrom('stays')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .forUpdate()
            .executeTakeFirst();
        return row || null;
    }
    async findActiveByResident(residentId, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .selectFrom('stays')
            .selectAll()
            .where('resident_id', '=', residentId)
            .where('organization_id', '=', organizationId)
            .where('status', '=', 'ACTIVE')
            .executeTakeFirst();
        return row || null;
    }
    async findAllByResident(residentId, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const rows = await executor
            .selectFrom('stays')
            .selectAll()
            .where('resident_id', '=', residentId)
            .where('organization_id', '=', organizationId)
            .orderBy('admission_date', 'desc')
            .execute();
        return rows;
    }
    async createForOrganization(organizationId, data, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .insertInto('stays')
            .values({
            organization_id: organizationId,
            resident_id: data.residentId,
            admission_date: data.admissionDate || new Date(),
            expected_checkout_date: data.expectedCheckoutDate || null,
            actual_checkout_date: null,
            status: data.status || 'ACTIVE',
            notes: data.notes || null,
        })
            .returningAll()
            .executeTakeFirstOrThrow();
        return row;
    }
    async completeStay(id, organizationId, actualCheckoutDate, notes, trx) {
        const executor = this.getExecutor(trx);
        const updatePayload = {
            status: 'COMPLETED',
            actual_checkout_date: actualCheckoutDate || new Date(),
            updated_at: new Date(),
        };
        if (notes !== undefined)
            updatePayload['notes'] = notes;
        const row = await executor
            .updateTable('stays')
            .set(updatePayload)
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
        if (data.expectedCheckoutDate !== undefined)
            updatePayload['expected_checkout_date'] = data.expectedCheckoutDate;
        if (data.notes !== undefined)
            updatePayload['notes'] = data.notes;
        const row = await executor
            .updateTable('stays')
            .set(updatePayload)
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirst();
        return row || null;
    }
    async findActiveStaysByOrganization(organizationId, trx) {
        const executor = this.getExecutor(trx);
        const rows = await executor
            .selectFrom('stays')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('status', '=', 'ACTIVE')
            .execute();
        return rows;
    }
}
exports.KyselyStayRepository = KyselyStayRepository;
//# sourceMappingURL=stay.repository.js.map