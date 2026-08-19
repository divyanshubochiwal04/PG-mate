"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyResidentReportingRepository = void 0;
const kysely_1 = require("kysely");
const contracts_1 = require("@m-square/contracts");
class KyselyResidentReportingRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async getResidentReport(organizationId, filter) {
        const page = filter.page && filter.page > 0 ? filter.page : 1;
        const pageSize = filter.pageSize && filter.pageSize > 0 ? Math.min(filter.pageSize, 100) : 10;
        const { offset, limit } = (0, contracts_1.calculatePaginationBounds)(page, pageSize);
        // Summary query
        const totalRes = await this.db
            .selectFrom('residents')
            .select((0, kysely_1.sql) `COUNT(id)::int`.as('cnt'))
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        const activeRes = await this.db
            .selectFrom('residents')
            .select((0, kysely_1.sql) `COUNT(id)::int`.as('cnt'))
            .where('organization_id', '=', organizationId)
            .where('status', '=', 'ACTIVE')
            .executeTakeFirst();
        const checkedOutRes = await this.db
            .selectFrom('stays')
            .select((0, kysely_1.sql) `COUNT(DISTINCT resident_id)::int`.as('cnt'))
            .where('organization_id', '=', organizationId)
            .where('status', '=', 'COMPLETED')
            .executeTakeFirst();
        const noStayRes = await this.db
            .selectFrom('residents as r')
            .select((0, kysely_1.sql) `COUNT(r.id)::int`.as('cnt'))
            .where('r.organization_id', '=', organizationId)
            .where('r.status', '=', 'ACTIVE')
            .where((eb) => eb.not(eb.exists(eb
            .selectFrom('stays as s')
            .select('s.id')
            .whereRef('s.resident_id', '=', 'r.id')
            .where('s.status', '=', 'ACTIVE'))))
            .executeTakeFirst();
        const occBedsRes = await this.db
            .selectFrom('bed_allocations')
            .select((0, kysely_1.sql) `COUNT(DISTINCT bed_id)::int`.as('cnt'))
            .where('organization_id', '=', organizationId)
            .where('status', '=', 'ACTIVE')
            .executeTakeFirst();
        const dueRes = await this.db
            .selectFrom('invoices')
            .select((0, kysely_1.sql) `COALESCE(SUM(balance_due_amount), 0)::float`.as('total'))
            .where('organization_id', '=', organizationId)
            .where('status', 'in', ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'])
            .executeTakeFirst();
        // Base query without select fields
        let baseQuery = this.db
            .selectFrom('residents as r')
            .leftJoin('stays as s', (join) => join.onRef('s.resident_id', '=', 'r.id').on('s.status', '=', 'ACTIVE'))
            .leftJoin('bed_allocations as ba', (join) => join.onRef('ba.stay_id', '=', 's.id').on('ba.status', '=', 'ACTIVE'))
            .leftJoin('beds as bd', 'bd.id', 'ba.bed_id')
            .leftJoin('rooms as rm', 'rm.id', 'bd.room_id')
            .leftJoin('floors as fl', 'fl.id', 'rm.floor_id')
            .leftJoin('buildings as b', 'b.id', 'fl.building_id')
            .leftJoin('properties as p', 'p.id', 'b.property_id')
            .leftJoin('resident_mess_subscriptions as ms', (join) => join.onRef('ms.stay_id', '=', 's.id').on('ms.status', '=', 'ACTIVE'))
            .where('r.organization_id', '=', organizationId);
        if (filter.propertyId) {
            baseQuery = baseQuery.where('p.id', '=', filter.propertyId);
        }
        if (filter.buildingId) {
            baseQuery = baseQuery.where('b.id', '=', filter.buildingId);
        }
        if (filter.search && filter.search.trim().length > 0) {
            const term = `%${filter.search.trim().toLowerCase()}%`;
            baseQuery = baseQuery.where((eb) => eb.or([
                eb('r.first_name', 'ilike', term),
                eb('r.last_name', 'ilike', term),
                eb('r.resident_code', 'ilike', term),
                eb('r.phone', 'ilike', term),
            ]));
        }
        const countRes = await baseQuery
            .select((0, kysely_1.sql) `COUNT(DISTINCT r.id)::int`.as('total'))
            .executeTakeFirstOrThrow();
        const total = countRes.total || 0;
        const rows = await baseQuery
            .select([
            'r.id as residentId',
            'r.resident_code as residentCode',
            (0, kysely_1.sql) `CONCAT(r.first_name, ' ', r.last_name)`.as('fullName'),
            'r.phone as phone',
            'r.email as email',
            'r.status as status',
            's.status as stayStatus',
            'p.name as propertyName',
            'b.name as buildingName',
            'fl.floor_number as floorNumber',
            'rm.room_number as roomNumber',
            'bd.bed_number as bedNumber',
            's.admission_date as admissionDate',
            's.actual_checkout_date as checkoutDate',
            'ms.status as messStatus',
            (0, kysely_1.sql) `COALESCE((
          SELECT SUM(inv.balance_due_amount)
          FROM invoices inv
          WHERE inv.resident_id = r.id AND inv.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')
        ), 0)::float`.as('outstandingAmount'),
        ])
            .orderBy('r.created_at', 'desc')
            .offset(offset)
            .limit(limit)
            .execute();
        const formattedRows = rows.map((r) => ({
            residentId: r.residentId,
            residentCode: r.residentCode,
            fullName: r.fullName,
            phone: r.phone || null,
            email: r.email || null,
            status: r.status,
            stayStatus: r.stayStatus || null,
            propertyName: r.propertyName || null,
            buildingName: r.buildingName || null,
            floorNumber: r.floorNumber !== null && r.floorNumber !== undefined ? Number(r.floorNumber) : null,
            roomNumber: r.roomNumber || null,
            bedNumber: r.bedNumber || null,
            admissionDate: r.admissionDate ? new Date(r.admissionDate).toISOString().split('T')[0] : null,
            checkoutDate: r.checkoutDate ? new Date(r.checkoutDate).toISOString().split('T')[0] : null,
            messStatus: r.messStatus || null,
            outstandingAmount: Number(r.outstandingAmount || 0),
        }));
        return {
            summary: {
                totalResidents: totalRes?.cnt || 0,
                activeResidents: activeRes?.cnt || 0,
                checkedOutResidents: checkedOutRes?.cnt || 0,
                residentsWithoutStay: noStayRes?.cnt || 0,
                occupiedBeds: occBedsRes?.cnt || 0,
                outstandingAmount: Number(dueRes?.total || 0),
            },
            rows: formattedRows,
            page,
            pageSize,
            total,
        };
    }
}
exports.KyselyResidentReportingRepository = KyselyResidentReportingRepository;
//# sourceMappingURL=reporting-resident.repository.js.map