import { type Kysely, sql } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type {
  ExpenseReportCategoryDto,
  ExpenseReportResponseDto,
  ExpenseReportRowDto,
  PropertyPerformanceItemDto,
  PropertyPerformanceReportDto,
  ReportFilterDto,
} from '@m-square/contracts';
import { calculatePaginationBounds } from '@m-square/contracts';

export class KyselyFinancialReportingRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async getExpenseReport(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<ExpenseReportResponseDto> {
    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const pageSize = filter.pageSize && filter.pageSize > 0 ? Math.min(filter.pageSize, 100) : 10;
    const { offset, limit } = calculatePaginationBounds(page, pageSize);

    let query = this.db
      .selectFrom('mess_expenses as e')
      .leftJoin('mess_vendors as v', 'v.id', 'e.vendor_id')
      .where('e.organization_id', '=', organizationId);

    if (filter.fromDate) {
      query = query.where('e.expense_date', '>=', filter.fromDate);
    }
    if (filter.toDate) {
      query = query.where('e.expense_date', '<=', filter.toDate);
    }
    if (filter.search && filter.search.trim().length > 0) {
      const term = `%${filter.search.trim().toLowerCase()}%`;
      query = query.where((eb) =>
        eb.or([
          eb(sql`e.category::text`, 'ilike', term),
          eb('e.notes', 'ilike', term),
          eb('v.name', 'ilike', term),
        ])
      );
    }

    const countRes = await query
      .select(sql<number>`COUNT(DISTINCT e.id)::int`.as('total'))
      .executeTakeFirstOrThrow();
    const total = countRes.total || 0;

    const summaryRes = await query
      .select([
        sql<number>`COUNT(DISTINCT e.id)::int`.as('expenseCount'),
        sql<number>`COALESCE(SUM(e.amount), 0)::float`.as('totalExpenses'),
      ])
      .executeTakeFirst();

    const categoryRows = await query
      .select([
        'e.category as category',
        sql<number>`COUNT(e.id)::int`.as('count'),
        sql<number>`COALESCE(SUM(e.amount), 0)::float`.as('totalAmount'),
      ])
      .groupBy('e.category')
      .orderBy('totalAmount', 'desc')
      .execute();

    const categories: ExpenseReportCategoryDto[] = categoryRows.map((c: any) => ({
      category: c.category,
      count: Number(c.count || 0),
      totalAmount: Number(c.totalAmount || 0),
    }));

    const rows = await query
      .select([
        'e.id as expenseId',
        'e.category as category',
        'e.notes as description',
        'v.name as vendorName',
        'e.expense_date as expenseDate',
        sql<number>`e.amount::float`.as('amount'),
      ])
      .orderBy('e.created_at', 'desc')
      .offset(offset)
      .limit(limit)
      .execute();

    const formattedRows: ExpenseReportRowDto[] = rows.map((r: any) => ({
      expenseId: r.expenseId,
      category: r.category,
      description: r.description || null,
      vendorName: r.vendorName || null,
      expenseDate: new Date(r.expenseDate).toISOString().split('T')[0],
      amount: Number(r.amount || 0),
    }));

    return {
      summary: {
        expenseCount: Number(summaryRes?.expenseCount || 0),
        totalExpenses: Number(summaryRes?.totalExpenses || 0),
      },
      categories,
      rows: formattedRows,
      page,
      pageSize,
      total,
    };
  }

  public async getPropertyPerformanceReport(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<PropertyPerformanceReportDto> {
    let query = this.db
      .selectFrom('properties as p')
      .leftJoin('buildings as b', 'b.property_id', 'p.id')
      .where('p.organization_id', '=', organizationId);

    if (filter.propertyId) query = query.where('p.id', '=', filter.propertyId);
    if (filter.buildingId) query = query.where('b.id', '=', filter.buildingId);

    const rows = await query
      .select([
        'p.id as propertyId',
        'p.name as propertyName',
        'b.id as buildingId',
        'b.name as buildingName',
        sql<number>`(SELECT COUNT(rm.id)::int FROM rooms rm JOIN floors fl ON fl.id = rm.floor_id WHERE fl.building_id = b.id AND rm.organization_id = ${organizationId})`.as('totalRooms'),
        sql<number>`(SELECT COUNT(bd.id)::int FROM beds bd JOIN rooms rm ON rm.id = bd.room_id JOIN floors fl ON fl.id = rm.floor_id WHERE fl.building_id = b.id AND bd.organization_id = ${organizationId})`.as('totalBeds'),
        sql<number>`(SELECT COUNT(DISTINCT ba.bed_id)::int FROM bed_allocations ba JOIN beds bd ON bd.id = ba.bed_id JOIN rooms rm ON rm.id = bd.room_id JOIN floors fl ON fl.id = rm.floor_id WHERE fl.building_id = b.id AND ba.status = 'ACTIVE' AND ba.organization_id = ${organizationId})`.as('occupiedBeds'),
        sql<number>`(SELECT COUNT(DISTINCT s.resident_id)::int FROM stays s JOIN bed_allocations ba ON ba.stay_id = s.id JOIN beds bd ON bd.id = ba.bed_id JOIN rooms rm ON rm.id = bd.room_id JOIN floors fl ON fl.id = rm.floor_id WHERE fl.building_id = b.id AND s.status = 'ACTIVE' AND s.organization_id = ${organizationId})`.as('activeResidents'),
        sql<number>`COALESCE((SELECT SUM(inv.total_amount) FROM invoices inv JOIN stays s ON s.id = inv.stay_id JOIN bed_allocations ba ON ba.stay_id = s.id JOIN beds bd ON bd.id = ba.bed_id JOIN rooms rm ON rm.id = bd.room_id JOIN floors fl ON fl.id = rm.floor_id WHERE fl.building_id = b.id AND inv.organization_id = ${organizationId}), 0)::float`.as('totalInvoiced'),
        sql<number>`COALESCE((SELECT SUM(inv.paid_amount) FROM invoices inv JOIN stays s ON s.id = inv.stay_id JOIN bed_allocations ba ON ba.stay_id = s.id JOIN beds bd ON bd.id = ba.bed_id JOIN rooms rm ON rm.id = bd.room_id JOIN floors fl ON fl.id = rm.floor_id WHERE fl.building_id = b.id AND inv.organization_id = ${organizationId}), 0)::float`.as('totalCollected'),
        sql<number>`COALESCE((SELECT SUM(inv.balance_due_amount) FROM invoices inv JOIN stays s ON s.id = inv.stay_id JOIN bed_allocations ba ON ba.stay_id = s.id JOIN beds bd ON bd.id = ba.bed_id JOIN rooms rm ON rm.id = bd.room_id JOIN floors fl ON fl.id = rm.floor_id WHERE fl.building_id = b.id AND inv.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE') AND inv.organization_id = ${organizationId}), 0)::float`.as('totalOutstanding'),
        sql<number>`COALESCE((SELECT SUM(e.amount) FROM mess_expenses e WHERE e.organization_id = ${organizationId}), 0)::float`.as('totalExpenses'),
        sql<number>`COALESCE((SELECT COUNT(ms.id)::int FROM resident_mess_subscriptions ms JOIN stays s ON s.id = ms.stay_id JOIN bed_allocations ba ON ba.stay_id = s.id JOIN beds bd ON bd.id = ba.bed_id JOIN rooms rm ON rm.id = bd.room_id JOIN floors fl ON fl.id = rm.floor_id WHERE fl.building_id = b.id AND ms.status = 'ACTIVE' AND ms.organization_id = ${organizationId}), 0)`.as('activeMessSubscriptions'),
        sql<number>`(SELECT COUNT(item.id)::int FROM mess_inventory_items item WHERE item.current_stock <= item.reorder_level AND item.organization_id = ${organizationId})`.as('lowStockItems'),
      ])
      .orderBy('p.name', 'asc')
      .orderBy('b.name', 'asc')
      .execute();

    let totalBedsSum = 0;
    let occupiedBedsSum = 0;
    let totalCollectedSum = 0;
    let totalExpensesSum = 0;
    const propertySet = new Set<string>();

    const items: PropertyPerformanceItemDto[] = rows.map((r: any) => {
      const bTotalBeds = Number(r.totalBeds || 0);
      const bOccupiedBeds = Number(r.occupiedBeds || 0);
      const occPct = bTotalBeds > 0 ? Math.round((bOccupiedBeds / bTotalBeds) * 100) : 0;

      const invoiced = Number(r.totalInvoiced || 0);
      const collected = Number(r.totalCollected || 0);
      const outstanding = Number(r.totalOutstanding || 0);
      const exp = Number(r.totalExpenses || 0);
      const netCash = collected - exp;

      totalBedsSum += bTotalBeds;
      occupiedBedsSum += bOccupiedBeds;
      totalCollectedSum += collected;
      totalExpensesSum += exp;
      if (r.propertyId) propertySet.add(r.propertyId);

      return {
        propertyId: r.propertyId,
        propertyName: r.propertyName,
        buildingId: r.buildingId || null,
        buildingName: r.buildingName || null,
        totalRooms: Number(r.totalRooms || 0),
        totalBeds: bTotalBeds,
        occupiedBeds: bOccupiedBeds,
        occupancyPercentage: occPct,
        activeResidents: Number(r.activeResidents || 0),
        totalInvoiced: invoiced,
        totalCollected: collected,
        totalOutstanding: outstanding,
        totalExpenses: exp,
        netCashFlow: netCash,
        activeMessSubscriptions: Number(r.activeMessSubscriptions || 0),
        lowStockItems: Number(r.lowStockItems || 0),
      };
    });

    const overallOccPct =
      totalBedsSum > 0 ? Math.round((occupiedBedsSum / totalBedsSum) * 100) : 0;
    const netCashFlowSum = totalCollectedSum - totalExpensesSum;

    return {
      summary: {
        totalProperties: propertySet.size,
        totalBeds: totalBedsSum,
        occupiedBeds: occupiedBedsSum,
        overallOccupancyPercentage: overallOccPct,
        totalCollected: totalCollectedSum,
        totalExpenses: totalExpensesSum,
        totalNetCashFlow: netCashFlowSum,
      },
      items,
    };
  }
}
