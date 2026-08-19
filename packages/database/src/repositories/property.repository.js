"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyPropertyRepository = void 0;
const contracts_1 = require("@m-square/contracts");
class KyselyPropertyRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findByIdForOrganization(id, organizationId) {
        const row = await this.db
            .selectFrom('properties')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    async findAllForOrganization(organizationId, params, search, status) {
        const { offset, limit } = (0, contracts_1.calculatePaginationBounds)(params.page, params.pageSize);
        // ── Item query — filtered for pagination
        let query = this.db
            .selectFrom('properties')
            .selectAll()
            .where('organization_id', '=', organizationId);
        // ── Count query — must apply identical predicates so that pagination.total
        //    reflects the filtered result set, not the unfiltered tenant dataset (P1-A fix)
        let countQuery = this.db
            .selectFrom('properties')
            .select(this.db.fn.count('id').as('total'))
            .where('organization_id', '=', organizationId);
        if (search && search.trim().length > 0) {
            const term = `%${search.trim().toLowerCase()}%`;
            query = query.where((eb) => eb.or([eb('name', 'ilike', term), eb('code', 'ilike', term), eb('city', 'ilike', term)]));
            countQuery = countQuery.where((eb) => eb.or([eb('name', 'ilike', term), eb('code', 'ilike', term), eb('city', 'ilike', term)]));
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
    async createForOrganization(organizationId, data) {
        const row = await this.db
            .insertInto('properties')
            .values({
            organization_id: organizationId,
            name: data.name,
            code: data.code.toUpperCase(),
            address_line1: data.addressLine1,
            address_line2: data.addressLine2 || null,
            locality: data.locality,
            city: data.city,
            state: data.state,
            postal_code: data.postalCode,
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
        if (data.addressLine1 !== undefined)
            updatePayload['address_line1'] = data.addressLine1;
        if (data.addressLine2 !== undefined)
            updatePayload['address_line2'] = data.addressLine2;
        if (data.locality !== undefined)
            updatePayload['locality'] = data.locality;
        if (data.city !== undefined)
            updatePayload['city'] = data.city;
        if (data.state !== undefined)
            updatePayload['state'] = data.state;
        if (data.postalCode !== undefined)
            updatePayload['postal_code'] = data.postalCode;
        if (data.status !== undefined)
            updatePayload['status'] = data.status;
        const row = await this.db
            .updateTable('properties')
            .set(updatePayload)
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirst();
        return row || null;
    }
    async deleteForOrganization(id, organizationId) {
        const result = await this.db
            .deleteFrom('properties')
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return Number(result.numDeletedRows) > 0;
    }
    async countBuildingsInProperty(propertyId, organizationId) {
        const res = await this.db
            .selectFrom('buildings')
            .select(this.db.fn.count('id').as('cnt'))
            .where('property_id', '=', propertyId)
            .where('organization_id', '=', organizationId)
            .executeTakeFirstOrThrow();
        return parseInt(res.cnt, 10);
    }
}
exports.KyselyPropertyRepository = KyselyPropertyRepository;
//# sourceMappingURL=property.repository.js.map