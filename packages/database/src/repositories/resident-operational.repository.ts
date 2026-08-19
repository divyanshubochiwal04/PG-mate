import type { Kysely } from 'kysely';
import { sql } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type {
  ResidentOperationalListItemDto,
  ResidentOperationalListResponseDto,
  ResidentOperationalQueryPayload,
  ResidentOperationalSummaryDto,
  ResidentStatus,
  StayStatus,
} from '@m-square/contracts';
import { calculatePaginationBounds } from '@m-square/contracts';

export class KyselyResidentOperationalRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async findOperationalList(
    organizationId: string,
    params: ResidentOperationalQueryPayload
  ): Promise<ResidentOperationalListResponseDto> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const { offset, limit } = calculatePaginationBounds(page, pageSize);

    let query = this.db
      .selectFrom('residents as r')
      .where('r.organization_id', '=', organizationId)
      .leftJoin('stays as s', (join) =>
        join
          .onRef('s.resident_id', '=', 'r.id')
          .on('s.organization_id', '=', organizationId)
          .on((eb) =>
            eb.or([
              eb('s.status', '=', 'ACTIVE'),
              eb(
                's.id',
                '=',
                sql<string>`(SELECT s_sub.id FROM stays s_sub WHERE s_sub.resident_id = r.id AND s_sub.organization_id = ${organizationId} ORDER BY s_sub.created_at DESC LIMIT 1)`
              ),
            ])
          )
      )
      .leftJoin('bed_allocations as ba', (join) =>
        join
          .onRef('ba.stay_id', '=', 's.id')
          .on('ba.organization_id', '=', organizationId)
          .on('ba.status', '=', 'ACTIVE')
      )
      .leftJoin('beds as b', (join) =>
        join
          .onRef('b.id', '=', 'ba.bed_id')
          .on('b.organization_id', '=', organizationId)
      )
      .leftJoin('rooms as rm', (join) =>
        join
          .onRef('rm.id', '=', 'b.room_id')
          .on('rm.organization_id', '=', organizationId)
      )
      .leftJoin('floors as fl', (join) =>
        join
          .onRef('fl.id', '=', 'rm.floor_id')
          .on('fl.organization_id', '=', organizationId)
      )
      .leftJoin('buildings as bg', (join) =>
        join
          .onRef('bg.id', '=', 'fl.building_id')
          .on('bg.organization_id', '=', organizationId)
      )
      .leftJoin('properties as pr', (join) =>
        join
          .onRef('pr.id', '=', 'bg.property_id')
          .on('pr.organization_id', '=', organizationId)
      )
      .leftJoin('resident_mess_subscriptions as ms', (join) =>
        join
          .onRef('ms.stay_id', '=', 's.id')
          .on('ms.organization_id', '=', organizationId)
          .on('ms.status', '=', 'ACTIVE')
      )
      .leftJoin('mess_meal_plans as mp', (join) =>
        join
          .onRef('mp.id', '=', 'ms.meal_plan_id')
          .on('mp.organization_id', '=', organizationId)
      )
      .select([
        'r.id as residentId',
        'r.resident_code as residentCode',
        'r.first_name as firstName',
        'r.last_name as lastName',
        'r.phone as phone',
        'r.email as email',
        'r.status as status',
        'pr.id as propertyId',
        'pr.name as propertyName',
        'bg.id as buildingId',
        'bg.name as buildingName',
        'fl.id as floorId',
        'fl.floor_number as floorNumber',
        'rm.id as roomId',
        'rm.room_number as roomNumber',
        'b.id as bedId',
        'b.bed_number as bedNumber',
        'ba.id as allocationId',
        's.id as stayId',
        's.status as stayStatus',
        's.admission_date as admissionDate',
        's.expected_checkout_date as expectedCheckoutDate',
        's.actual_checkout_date as actualCheckoutDate',
        'ms.status as messSubscriptionStatus',
        'mp.name as messPlanName',
        sql<number>`COALESCE((
          SELECT SUM(inv.balance_due_amount)
          FROM invoices inv
          WHERE inv.resident_id = r.id
            AND inv.organization_id = ${organizationId}
            AND inv.status NOT IN ('PAID', 'CANCELLED')
        ), 0)`.as('outstandingBalance'),
      ]);

    let countQuery = this.db
      .selectFrom('residents as r')
      .where('r.organization_id', '=', organizationId)
      .leftJoin('stays as s', (join) =>
        join
          .onRef('s.resident_id', '=', 'r.id')
          .on('s.organization_id', '=', organizationId)
          .on((eb) =>
            eb.or([
              eb('s.status', '=', 'ACTIVE'),
              eb(
                's.id',
                '=',
                sql<string>`(SELECT s_sub.id FROM stays s_sub WHERE s_sub.resident_id = r.id AND s_sub.organization_id = ${organizationId} ORDER BY s_sub.created_at DESC LIMIT 1)`
              ),
            ])
          )
      )
      .leftJoin('bed_allocations as ba', (join) =>
        join
          .onRef('ba.stay_id', '=', 's.id')
          .on('ba.organization_id', '=', organizationId)
          .on('ba.status', '=', 'ACTIVE')
      )
      .leftJoin('beds as b', (join) =>
        join
          .onRef('b.id', '=', 'ba.bed_id')
          .on('b.organization_id', '=', organizationId)
      )
      .leftJoin('rooms as rm', (join) =>
        join
          .onRef('rm.id', '=', 'b.room_id')
          .on('rm.organization_id', '=', organizationId)
      )
      .leftJoin('floors as fl', (join) =>
        join
          .onRef('fl.id', '=', 'rm.floor_id')
          .on('fl.organization_id', '=', organizationId)
      )
      .leftJoin('buildings as bg', (join) =>
        join
          .onRef('bg.id', '=', 'fl.building_id')
          .on('bg.organization_id', '=', organizationId)
      )
      .leftJoin('properties as pr', (join) =>
        join
          .onRef('pr.id', '=', 'bg.property_id')
          .on('pr.organization_id', '=', organizationId)
      )
      .leftJoin('resident_mess_subscriptions as ms', (join) =>
        join
          .onRef('ms.stay_id', '=', 's.id')
          .on('ms.organization_id', '=', organizationId)
          .on('ms.status', '=', 'ACTIVE')
      )
      .select(sql<string>`COUNT(DISTINCT r.id)`.as('total'));

    if (params.search && params.search.trim().length > 0) {
      const term = `%${params.search.trim().toLowerCase()}%`;
      const searchCond = (eb: any) =>
        eb.or([
          eb('r.first_name', 'ilike', term),
          eb('r.last_name', 'ilike', term),
          eb('r.resident_code', 'ilike', term),
          eb('r.phone', 'ilike', term),
        ]);
      query = query.where(searchCond);
      countQuery = countQuery.where(searchCond);
    }

    if (params.stayStatus && params.stayStatus !== 'ALL') {
      if (params.stayStatus === 'ACTIVE') {
        query = query.where('s.status', '=', 'ACTIVE');
        countQuery = countQuery.where('s.status', '=', 'ACTIVE');
      } else if (params.stayStatus === 'CHECKED_OUT') {
        query = query.where('s.status', '=', 'COMPLETED');
        countQuery = countQuery.where('s.status', '=', 'COMPLETED');
      } else if (params.stayStatus === 'NO_STAY') {
        query = query.where('s.id', 'is', null);
        countQuery = countQuery.where('s.id', 'is', null);
      }
    }

    if (params.propertyId) {
      query = query.where('pr.id', '=', params.propertyId);
      countQuery = countQuery.where('pr.id', '=', params.propertyId);
    }
    if (params.buildingId) {
      query = query.where('bg.id', '=', params.buildingId);
      countQuery = countQuery.where('bg.id', '=', params.buildingId);
    }
    if (params.floorId) {
      query = query.where('fl.id', '=', params.floorId);
      countQuery = countQuery.where('fl.id', '=', params.floorId);
    }

    if (params.messStatus && params.messStatus !== 'ALL') {
      if (params.messStatus === 'ACTIVE') {
        query = query.where('ms.status', '=', 'ACTIVE');
        countQuery = countQuery.where('ms.status', '=', 'ACTIVE');
      } else if (params.messStatus === 'NONE') {
        query = query.where((eb) =>
          eb.or([eb('ms.id', 'is', null), eb('ms.status', '!=', 'ACTIVE')])
        );
        countQuery = countQuery.where((eb) =>
          eb.or([eb('ms.id', 'is', null), eb('ms.status', '!=', 'ACTIVE')])
        );
      }
    }

    if (params.billingStatus && params.billingStatus !== 'ALL') {
      const dueSql = sql<number>`COALESCE((
        SELECT SUM(inv.balance_due_amount)
        FROM invoices inv
        WHERE inv.resident_id = r.id
          AND inv.organization_id = ${organizationId}
          AND inv.status NOT IN ('PAID', 'CANCELLED')
      ), 0)`;

      if (params.billingStatus === 'DUE') {
        query = query.where(dueSql, '>', 0);
        countQuery = countQuery.where(dueSql, '>', 0);
      } else if (params.billingStatus === 'PAID') {
        query = query.where(dueSql, '=', 0);
        countQuery = countQuery.where(dueSql, '=', 0);
      }
    }

    const countResult = await countQuery.executeTakeFirstOrThrow();
    const total = parseInt(countResult.total, 10);

    const rows = await query
      .orderBy(sql`CASE WHEN s.status = 'ACTIVE' THEN 0 ELSE 1 END`, 'asc')
      .orderBy('r.first_name', 'asc')
      .orderBy('r.last_name', 'asc')
      .offset(offset)
      .limit(limit)
      .execute();

    const items: ResidentOperationalListItemDto[] = rows.map((row: any) => ({
      residentId: row.residentId,
      residentCode: row.residentCode,
      firstName: row.firstName,
      lastName: row.lastName,
      fullName: `${row.firstName} ${row.lastName}`.trim(),
      phone: row.phone,
      email: row.email || null,
      status: row.status as ResidentStatus,
      propertyId: row.propertyId || null,
      propertyName: row.propertyName || null,
      buildingId: row.buildingId || null,
      buildingName: row.buildingName || null,
      floorId: row.floorId || null,
      floorNumber: row.floorNumber !== null && row.floorNumber !== undefined ? Number(row.floorNumber) : null,
      roomId: row.roomId || null,
      roomNumber: row.roomNumber || null,
      bedId: row.bedId || null,
      bedNumber: row.bedNumber || null,
      allocationId: row.allocationId || null,
      stayId: row.stayId || null,
      stayStatus: row.stayStatus ? (row.stayStatus as StayStatus) : null,
      admissionDate: row.admissionDate ? new Date(row.admissionDate).toISOString() : null,
      expectedCheckoutDate: row.expectedCheckoutDate ? new Date(row.expectedCheckoutDate).toISOString() : null,
      actualCheckoutDate: row.actualCheckoutDate ? new Date(row.actualCheckoutDate).toISOString() : null,
      messSubscriptionStatus: row.messSubscriptionStatus || null,
      messPlanName: row.messPlanName || null,
      outstandingBalance: Number(row.outstandingBalance) || 0,
    }));

    const totalPages = Math.ceil(total / pageSize) || 1;

    return {
      items,
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  public async getOperationalSummary(organizationId: string): Promise<ResidentOperationalSummaryDto> {
    const totalResRow = await this.db
      .selectFrom('residents')
      .select(this.db.fn.count<string>('id').as('cnt'))
      .where('organization_id', '=', organizationId)
      .executeTakeFirstOrThrow();

    const activeResRow = await this.db
      .selectFrom('stays')
      .select(this.db.fn.count<string>('id').as('cnt'))
      .where('organization_id', '=', organizationId)
      .where('status', '=', 'ACTIVE')
      .executeTakeFirstOrThrow();

    const checkedOutRow = await this.db
      .selectFrom('residents as r')
      .select(sql<string>`COUNT(DISTINCT r.id)`.as('cnt'))
      .where('r.organization_id', '=', organizationId)
      .where(
        sql<boolean>`NOT EXISTS (SELECT 1 FROM stays s_act WHERE s_act.resident_id = r.id AND s_act.organization_id = ${organizationId} AND s_act.status = 'ACTIVE')`
      )
      .where(
        sql<boolean>`EXISTS (SELECT 1 FROM stays s_comp WHERE s_comp.resident_id = r.id AND s_comp.organization_id = ${organizationId} AND s_comp.status = 'COMPLETED')`
      )
      .executeTakeFirstOrThrow();

    const noStayRow = await this.db
      .selectFrom('residents as r')
      .select(sql<string>`COUNT(r.id)`.as('cnt'))
      .where('r.organization_id', '=', organizationId)
      .where(
        sql<boolean>`NOT EXISTS (SELECT 1 FROM stays s WHERE s.resident_id = r.id AND s.organization_id = ${organizationId})`
      )
      .executeTakeFirstOrThrow();

    const occupiedBedsRow = await this.db
      .selectFrom('beds')
      .select(this.db.fn.count<string>('id').as('cnt'))
      .where('organization_id', '=', organizationId)
      .where('status', '=', 'OCCUPIED')
      .executeTakeFirstOrThrow();

    const dueSumRow = await this.db
      .selectFrom('invoices')
      .select(sql<number>`COALESCE(SUM(balance_due_amount), 0)`.as('sum'))
      .where('organization_id', '=', organizationId)
      .where('status', 'not in', ['PAID', 'CANCELLED'])
      .executeTakeFirstOrThrow();

    return {
      totalResidents: parseInt(totalResRow.cnt, 10),
      activeResidents: parseInt(activeResRow.cnt, 10),
      checkedOutResidents: parseInt(checkedOutRow.cnt, 10),
      residentsWithoutStay: parseInt(noStayRow.cnt, 10),
      occupiedBeds: parseInt(occupiedBedsRow.cnt, 10),
      outstandingAmount: Number(dueSumRow.sum) || 0,
    };
  }
}
