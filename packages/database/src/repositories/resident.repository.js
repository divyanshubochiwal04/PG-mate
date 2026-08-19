"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyResidentRepository = void 0;
const contracts_1 = require("@m-square/contracts");
const resident_operational_repository_1 = require("./resident-operational.repository");
class KyselyResidentRepository {
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
            .selectFrom('residents')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    async findByIdForUpdate(id, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .selectFrom('residents')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .forUpdate()
            .executeTakeFirst();
        return row || null;
    }
    async findAllForOrganization(organizationId, params, search, status) {
        const { offset, limit } = (0, contracts_1.calculatePaginationBounds)(params.page, params.pageSize);
        let query = this.db
            .selectFrom('residents')
            .selectAll()
            .where('organization_id', '=', organizationId);
        let countQuery = this.db
            .selectFrom('residents')
            .select(this.db.fn.count('id').as('total'))
            .where('organization_id', '=', organizationId);
        if (search && search.trim().length > 0) {
            const term = `%${search.trim().toLowerCase()}%`;
            query = query.where((eb) => eb.or([
                eb('first_name', 'ilike', term),
                eb('last_name', 'ilike', term),
                eb('resident_code', 'ilike', term),
                eb('phone', 'ilike', term),
            ]));
            countQuery = countQuery.where((eb) => eb.or([
                eb('first_name', 'ilike', term),
                eb('last_name', 'ilike', term),
                eb('resident_code', 'ilike', term),
                eb('phone', 'ilike', term),
            ]));
        }
        if (status && status.trim().length > 0) {
            query = query.where('status', '=', status.trim());
            countQuery = countQuery.where('status', '=', status.trim());
        }
        const countResult = await countQuery.executeTakeFirstOrThrow();
        const total = parseInt(countResult.total, 10);
        const rows = await query.orderBy('created_at', 'desc').offset(offset).limit(limit).execute();
        return (0, contracts_1.createPaginatedResult)(rows, total, params.page, params.pageSize);
    }
    async findOperationalList(organizationId, params) {
        const opRepo = new resident_operational_repository_1.KyselyResidentOperationalRepository(this.db);
        return opRepo.findOperationalList(organizationId, params);
    }
    async getOperationalSummary(organizationId) {
        const opRepo = new resident_operational_repository_1.KyselyResidentOperationalRepository(this.db);
        return opRepo.getOperationalSummary(organizationId);
    }
    async createForOrganization(organizationId, data, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .insertInto('residents')
            .values({
            organization_id: organizationId,
            resident_code: data.residentCode,
            first_name: data.firstName,
            middle_name: data.middleName || null,
            last_name: data.lastName,
            preferred_name: data.preferredName || null,
            date_of_birth: data.dateOfBirth || null,
            gender: data.gender,
            phone: data.phone,
            alternate_phone: data.alternatePhone || null,
            email: data.email || null,
            address_line1: data.addressLine1 || null,
            city: data.city || null,
            state: data.state || null,
            postal_code: data.postalCode || null,
            status: data.status || 'ACTIVE',
        })
            .returningAll()
            .executeTakeFirstOrThrow();
        return row;
    }
    async updateForOrganization(id, organizationId, data, trx) {
        const executor = this.getExecutor(trx);
        const updatePayload = {
            updated_at: new Date(),
        };
        if (data.firstName !== undefined)
            updatePayload['first_name'] = data.firstName;
        if (data.middleName !== undefined)
            updatePayload['middle_name'] = data.middleName;
        if (data.lastName !== undefined)
            updatePayload['last_name'] = data.lastName;
        if (data.preferredName !== undefined)
            updatePayload['preferred_name'] = data.preferredName;
        if (data.dateOfBirth !== undefined)
            updatePayload['date_of_birth'] = data.dateOfBirth;
        if (data.gender !== undefined)
            updatePayload['gender'] = data.gender;
        if (data.phone !== undefined)
            updatePayload['phone'] = data.phone;
        if (data.alternatePhone !== undefined)
            updatePayload['alternate_phone'] = data.alternatePhone;
        if (data.email !== undefined)
            updatePayload['email'] = data.email;
        if (data.addressLine1 !== undefined)
            updatePayload['address_line1'] = data.addressLine1;
        if (data.city !== undefined)
            updatePayload['city'] = data.city;
        if (data.state !== undefined)
            updatePayload['state'] = data.state;
        if (data.postalCode !== undefined)
            updatePayload['postal_code'] = data.postalCode;
        if (data.status !== undefined)
            updatePayload['status'] = data.status;
        const row = await executor
            .updateTable('residents')
            .set(updatePayload)
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirst();
        return row || null;
    }
}
exports.KyselyResidentRepository = KyselyResidentRepository;
//# sourceMappingURL=resident.repository.js.map