"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyEmergencyContactRepository = void 0;
class KyselyEmergencyContactRepository {
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
            .selectFrom('emergency_contacts')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    async findAllByResident(residentId, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const rows = await executor
            .selectFrom('emergency_contacts')
            .selectAll()
            .where('resident_id', '=', residentId)
            .where('organization_id', '=', organizationId)
            .orderBy('is_primary', 'desc')
            .orderBy('created_at', 'asc')
            .execute();
        return rows;
    }
    async findPrimaryByResident(residentId, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .selectFrom('emergency_contacts')
            .selectAll()
            .where('resident_id', '=', residentId)
            .where('organization_id', '=', organizationId)
            .where('is_primary', '=', true)
            .executeTakeFirst();
        return row || null;
    }
    async unsetPrimaryForResident(residentId, organizationId, trx) {
        const executor = this.getExecutor(trx);
        await executor
            .updateTable('emergency_contacts')
            .set({ is_primary: false, updated_at: new Date() })
            .where('resident_id', '=', residentId)
            .where('organization_id', '=', organizationId)
            .where('is_primary', '=', true)
            .execute();
    }
    async createForResident(organizationId, data, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .insertInto('emergency_contacts')
            .values({
            resident_id: data.residentId,
            organization_id: organizationId,
            name: data.name,
            relationship: data.relationship,
            phone: data.phone,
            alternate_phone: data.alternatePhone || null,
            is_primary: data.isPrimary ?? true,
        })
            .returningAll()
            .executeTakeFirstOrThrow();
        return row;
    }
    async updateForResident(id, organizationId, data, trx) {
        const executor = this.getExecutor(trx);
        const updatePayload = {
            updated_at: new Date(),
        };
        if (data.name !== undefined)
            updatePayload['name'] = data.name;
        if (data.relationship !== undefined)
            updatePayload['relationship'] = data.relationship;
        if (data.phone !== undefined)
            updatePayload['phone'] = data.phone;
        if (data.alternatePhone !== undefined)
            updatePayload['alternate_phone'] = data.alternatePhone;
        if (data.isPrimary !== undefined)
            updatePayload['is_primary'] = data.isPrimary;
        const row = await executor
            .updateTable('emergency_contacts')
            .set(updatePayload)
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirst();
        return row || null;
    }
    async deleteForResident(id, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const res = await executor
            .deleteFrom('emergency_contacts')
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return Number(res.numDeletedRows) > 0;
    }
}
exports.KyselyEmergencyContactRepository = KyselyEmergencyContactRepository;
//# sourceMappingURL=emergency-contact.repository.js.map