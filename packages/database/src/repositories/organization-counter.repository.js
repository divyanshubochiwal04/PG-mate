"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyOrganizationCounterRepository = void 0;
class KyselyOrganizationCounterRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    getExecutor(trx) {
        return trx && typeof trx.selectFrom === 'function'
            ? trx
            : this.db;
    }
    async getNextValueForUpdate(organizationId, counterType, trx) {
        const executor = this.getExecutor(trx);
        // Lock counter row or insert if not exists
        const counter = await executor
            .selectFrom('organization_counters')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('counter_type', '=', counterType)
            .forUpdate()
            .executeTakeFirst();
        if (counter) {
            const nextVal = counter.current_value + 1;
            await executor
                .updateTable('organization_counters')
                .set({ current_value: nextVal, updated_at: new Date() })
                .where('id', '=', counter.id)
                .execute();
            return nextVal;
        }
        // Insert new counter starting at 1
        const newCounter = await executor
            .insertInto('organization_counters')
            .values({
            organization_id: organizationId,
            counter_type: counterType,
            current_value: 1,
        })
            .returningAll()
            .executeTakeFirstOrThrow();
        return newCounter.current_value;
    }
}
exports.KyselyOrganizationCounterRepository = KyselyOrganizationCounterRepository;
//# sourceMappingURL=organization-counter.repository.js.map