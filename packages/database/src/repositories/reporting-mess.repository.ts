import { type Kysely, sql } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { MessReportResponseDto, MessReportRowDto, ReportFilterDto } from '@m-square/contracts';
import { calculatePaginationBounds } from '@m-square/contracts';

export class KyselyMessReportingRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async getMessReport(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<MessReportResponseDto> {
    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const pageSize = filter.pageSize && filter.pageSize > 0 ? Math.min(filter.pageSize, 100) : 10;
    const { offset, limit } = calculatePaginationBounds(page, pageSize);

    let baseQuery = this.db
      .selectFrom('resident_mess_subscriptions as ms')
      .innerJoin('residents as r', 'r.id', 'ms.resident_id')
      .innerJoin('messes as m', 'm.id', 'ms.mess_id')
      .innerJoin('mess_meal_plans as mp', 'mp.id', 'ms.meal_plan_id')
      .where('ms.organization_id', '=', organizationId);

    if (filter.search && filter.search.trim().length > 0) {
      const term = `%${filter.search.trim().toLowerCase()}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb('r.first_name', 'ilike', term),
          eb('r.last_name', 'ilike', term),
          eb('r.resident_code', 'ilike', term),
          eb('m.name', 'ilike', term),
        ])
      );
    }

    const countRes = await baseQuery
      .select(sql<number>`COUNT(DISTINCT ms.id)::int`.as('total'))
      .executeTakeFirstOrThrow();
    const total = countRes.total || 0;

    const summaryRes = await this.db
      .selectFrom('resident_mess_subscriptions as ms')
      .select([
        sql<number>`COUNT(CASE WHEN ms.status = 'ACTIVE' THEN 1 END)::int`.as('activeSubs'),
        sql<number>`COUNT(CASE WHEN ms.status = 'CANCELLED' THEN 1 END)::int`.as('cancelledSubs'),
        sql<number>`COALESCE(SUM(CASE WHEN ms.status = 'ACTIVE' THEN ms.price_at_subscription ELSE 0 END), 0)::float`.as('monthlyValue'),
      ])
      .where('ms.organization_id', '=', organizationId)
      .executeTakeFirst();

    const consRes = await this.db
      .selectFrom('mess_meal_consumptions')
      .select(sql<number>`COUNT(id)::int`.as('totalConsumptions'))
      .where('organization_id', '=', organizationId)
      .where('status', '=', 'CONSUMED')
      .executeTakeFirst();

    const rows = await baseQuery
      .select([
        'r.id as residentId',
        sql<string>`CONCAT(r.first_name, ' ', r.last_name)`.as('residentName'),
        'r.resident_code as residentCode',
        'm.name as messName',
        'mp.name as mealPlanName',
        'ms.status as subscriptionStatus',
        sql<number>`ms.price_at_subscription::float`.as('monthlyPrice'),
        'ms.start_date as startDate',
        'ms.end_date as endDate',
        sql<number>`(
          SELECT COUNT(mc.id)::int
          FROM mess_meal_consumptions mc
          WHERE mc.resident_id = r.id AND mc.status = 'CONSUMED' AND mc.organization_id = ${organizationId}
        )`.as('consumptionCount'),
      ])
      .orderBy('ms.created_at', 'desc')
      .offset(offset)
      .limit(limit)
      .execute();

    const formattedRows: MessReportRowDto[] = rows.map((r: any) => ({
      residentId: r.residentId,
      residentName: r.residentName,
      residentCode: r.residentCode,
      messName: r.messName,
      mealPlanName: r.mealPlanName,
      subscriptionStatus: r.subscriptionStatus,
      monthlyPrice: Number(r.monthlyPrice || 0),
      startDate: new Date(r.startDate).toISOString().split('T')[0],
      endDate: r.endDate ? new Date(r.endDate).toISOString().split('T')[0] : null,
      consumptionCount: Number(r.consumptionCount || 0),
    }));

    return {
      summary: {
        activeSubscriptions: Number(summaryRes?.activeSubs || 0),
        cancelledSubscriptions: Number(summaryRes?.cancelledSubs || 0),
        monthlySubscriptionValue: Number(summaryRes?.monthlyValue || 0),
        totalMealConsumptions: Number(consRes?.totalConsumptions || 0),
      },
      rows: formattedRows,
      page,
      pageSize,
      total,
    };
  }
}
