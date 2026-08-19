import { Injectable } from '@nestjs/common';
import {
  dbService,
  KyselyNotificationRepository,
  sql,
} from '@m-square/database';

@Injectable()
export class NotificationDetectorService {
  private readonly db = dbService.db;
  private readonly notificationRepo = new KyselyNotificationRepository(this.db);

  public async generateOperationalNotifications(
    organizationId: string
  ): Promise<{ generatedCount: number; resolvedCount: number }> {
    let generatedCount = 0;
    let resolvedCount = 0;

    // 1. OUTSTANDING DUES
    const residentsWithDues = await this.db
      .selectFrom('residents as r')
      .innerJoin('invoices as i', 'i.resident_id', 'r.id')
      .select([
        'r.id as resident_id',
        'r.first_name',
        'r.last_name',
        sql<number>`SUM(i.balance_due_amount)::numeric`.as('total_dues'),
      ])
      .where('r.organization_id', '=', organizationId)
      .where('r.status', '=', 'ACTIVE')
      .where('i.status', 'in', ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'])
      .where('i.balance_due_amount', '>', 0)
      .groupBy(['r.id', 'r.first_name', 'r.last_name'])
      .execute();

    const currentResidentIdsWithDues = new Set<string>();
    for (const res of residentsWithDues) {
      const totalDues = Number(res.total_dues);
      if (totalDues > 0) {
        currentResidentIdsWithDues.add(res.resident_id);
        const dedupeKey = `OUTSTANDING_DUES:${res.resident_id}`;
        const name = `${res.first_name} ${res.last_name}`.trim();
        const created = await this.notificationRepo.createIfNotExists(organizationId, {
          type: 'OUTSTANDING_DUES',
          severity: 'WARNING',
          title: 'Outstanding Dues',
          message: `${name} has ₹${totalDues.toLocaleString('en-IN')} outstanding.`,
          entity_type: 'RESIDENT',
          entity_id: res.resident_id,
          action_route: `/(owner)/residents/${res.resident_id}`,
          metadata: { totalDues },
          dedupe_key: dedupeKey,
          status: 'UNREAD',
          read_at: null,
          resolved_at: null,
          expires_at: null,
        });
        if (created) generatedCount++;
      }
    }

    const activeDuesNotifs = await this.db
      .selectFrom('notifications')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('type', '=', 'OUTSTANDING_DUES')
      .where('status', 'in', ['UNREAD', 'READ'])
      .execute();

    for (const notif of activeDuesNotifs) {
      if (notif.entity_id && !currentResidentIdsWithDues.has(notif.entity_id)) {
        await this.notificationRepo.resolve(notif.id, organizationId);
        resolvedCount++;
      }
    }

    // 2. OVERDUE INVOICES
    const todayStr = new Date().toISOString().split('T')[0];
    const overdueInvoices = await this.db
      .selectFrom('invoices')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('due_date', '<', todayStr)
      .where('status', 'in', ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'])
      .where('balance_due_amount', '>', 0)
      .execute();

    const currentOverdueInvoiceIds = new Set<string>();
    for (const inv of overdueInvoices) {
      currentOverdueInvoiceIds.add(inv.id);
      const dedupeKey = `OVERDUE_INVOICE:${inv.id}`;
      const balance = Number(inv.balance_due_amount);
      const created = await this.notificationRepo.createIfNotExists(organizationId, {
        type: 'OVERDUE_INVOICE',
        severity: 'CRITICAL',
        title: 'Overdue Invoice',
        message: `Invoice ${inv.invoice_number} is overdue with balance of ₹${balance.toLocaleString('en-IN')}.`,
        entity_type: 'INVOICE',
        entity_id: inv.id,
        action_route: `/(owner)/billing/invoices/${inv.id}`,
        metadata: { invoiceNumber: inv.invoice_number, balanceDue: balance, dueDate: inv.due_date },
        dedupe_key: dedupeKey,
        status: 'UNREAD',
        read_at: null,
        resolved_at: null,
        expires_at: null,
      });
      if (created) generatedCount++;
    }

    const activeOverdueNotifs = await this.db
      .selectFrom('notifications')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('type', '=', 'OVERDUE_INVOICE')
      .where('status', 'in', ['UNREAD', 'READ'])
      .execute();

    for (const notif of activeOverdueNotifs) {
      if (notif.entity_id && !currentOverdueInvoiceIds.has(notif.entity_id)) {
        await this.notificationRepo.resolve(notif.id, organizationId);
        resolvedCount++;
      }
    }

    // 3. LOW STOCK & OUT OF STOCK
    const inventoryItems = await this.db
      .selectFrom('mess_inventory_items')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .execute();

    const currentLowStockItemIds = new Set<string>();
    const currentOutOfStockItemIds = new Set<string>();

    for (const item of inventoryItems) {
      const stock = Number(item.current_stock);
      const reorderLevel = Number(item.reorder_level || 0);

      if (stock === 0) {
        currentOutOfStockItemIds.add(item.id);
        const dedupeKey = `OUT_OF_STOCK:${item.id}`;
        const created = await this.notificationRepo.createIfNotExists(organizationId, {
          type: 'OUT_OF_STOCK',
          severity: 'CRITICAL',
          title: 'Item Out of Stock',
          message: `${item.name} is completely out of stock!`,
          entity_type: 'INVENTORY_ITEM',
          entity_id: item.id,
          action_route: `/(owner)/mess/inventory/${item.id}`,
          metadata: { itemName: item.name, currentStock: 0 },
          dedupe_key: dedupeKey,
          status: 'UNREAD',
          read_at: null,
          resolved_at: null,
          expires_at: null,
        });
        if (created) generatedCount++;
      } else if (stock <= reorderLevel) {
        currentLowStockItemIds.add(item.id);
        const dedupeKey = `LOW_STOCK:${item.id}`;
        const created = await this.notificationRepo.createIfNotExists(organizationId, {
          type: 'LOW_STOCK',
          severity: 'WARNING',
          title: 'Low Stock Alert',
          message: `${item.name} stock (${stock} ${item.unit}) is below reorder level (${reorderLevel} ${item.unit}).`,
          entity_type: 'INVENTORY_ITEM',
          entity_id: item.id,
          action_route: `/(owner)/mess/inventory/${item.id}`,
          metadata: { itemName: item.name, currentStock: stock, reorderLevel },
          dedupe_key: dedupeKey,
          status: 'UNREAD',
          read_at: null,
          resolved_at: null,
          expires_at: null,
        });
        if (created) generatedCount++;
      }
    }

    const activeStockNotifs = await this.db
      .selectFrom('notifications')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('type', 'in', ['LOW_STOCK', 'OUT_OF_STOCK'])
      .where('status', 'in', ['UNREAD', 'READ'])
      .execute();

    for (const notif of activeStockNotifs) {
      if (notif.type === 'OUT_OF_STOCK' && notif.entity_id && !currentOutOfStockItemIds.has(notif.entity_id)) {
        await this.notificationRepo.resolve(notif.id, organizationId);
        resolvedCount++;
      } else if (notif.type === 'LOW_STOCK' && notif.entity_id && !currentLowStockItemIds.has(notif.entity_id)) {
        await this.notificationRepo.resolve(notif.id, organizationId);
        resolvedCount++;
      }
    }

    // 4. RESIDENT WITHOUT ACTIVE STAY
    const activeResidents = await this.db
      .selectFrom('residents')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('status', '=', 'ACTIVE')
      .execute();

    const activeStays = await this.db
      .selectFrom('stays')
      .select('resident_id')
      .where('organization_id', '=', organizationId)
      .where('status', '=', 'ACTIVE')
      .execute();

    const residentsWithActiveStay = new Set(activeStays.map((s) => s.resident_id));
    const currentNoStayResidentIds = new Set<string>();

    for (const res of activeResidents) {
      if (!residentsWithActiveStay.has(res.id)) {
        currentNoStayResidentIds.add(res.id);
        const dedupeKey = `NO_STAY:${res.id}`;
        const name = `${res.first_name} ${res.last_name}`.trim();
        const created = await this.notificationRepo.createIfNotExists(organizationId, {
          type: 'NO_STAY',
          severity: 'WARNING',
          title: 'Resident Without Active Stay',
          message: `${name} has no active stay assignment.`,
          entity_type: 'RESIDENT',
          entity_id: res.id,
          action_route: `/(owner)/residents/${res.id}`,
          metadata: { residentCode: res.resident_code },
          dedupe_key: dedupeKey,
          status: 'UNREAD',
          read_at: null,
          resolved_at: null,
          expires_at: null,
        });
        if (created) generatedCount++;
      }
    }

    const activeNoStayNotifs = await this.db
      .selectFrom('notifications')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('type', '=', 'NO_STAY')
      .where('status', 'in', ['UNREAD', 'READ'])
      .execute();

    for (const notif of activeNoStayNotifs) {
      if (notif.entity_id && !currentNoStayResidentIds.has(notif.entity_id)) {
        await this.notificationRepo.resolve(notif.id, organizationId);
        resolvedCount++;
      }
    }

    // 5. UPCOMING CHECKOUT
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);
    const next7DaysStr = next7Days.toISOString().split('T')[0];

    const upcomingCheckouts = await this.db
      .selectFrom('stays as s')
      .innerJoin('residents as r', 'r.id', 's.resident_id')
      .select([
        's.id as stay_id',
        's.resident_id',
        's.expected_checkout_date',
        'r.first_name',
        'r.last_name',
      ])
      .where('s.organization_id', '=', organizationId)
      .where('s.status', '=', 'ACTIVE')
      .where('s.expected_checkout_date', '>=', new Date(todayStr))
      .where('s.expected_checkout_date', '<=', new Date(next7DaysStr))
      .execute();

    for (const u of upcomingCheckouts) {
      if (u.expected_checkout_date) {
        const dateStr = typeof u.expected_checkout_date === 'string'
          ? u.expected_checkout_date
          : new Date(u.expected_checkout_date).toISOString().split('T')[0];
        const dedupeKey = `UPCOMING_CHECKOUT:${u.stay_id}:${dateStr}`;
        const name = `${u.first_name} ${u.last_name}`.trim();
        const created = await this.notificationRepo.createIfNotExists(organizationId, {
          type: 'UPCOMING_CHECKOUT',
          severity: 'INFO',
          title: 'Upcoming Checkout',
          message: `${name} is expected to check out on ${dateStr}.`,
          entity_type: 'STAY',
          entity_id: u.stay_id,
          action_route: `/(owner)/residents/${u.resident_id}`,
          metadata: { stayId: u.stay_id, residentId: u.resident_id, expectedCheckoutDate: dateStr },
          dedupe_key: dedupeKey,
          status: 'UNREAD',
          read_at: null,
          resolved_at: null,
          expires_at: null,
        });
        if (created) generatedCount++;
      }
    }

    // 6. HIGH OCCUPANCY
    const bedsCount = await this.db
      .selectFrom('beds')
      .select(sql<number>`count(*)::int`.as('total'))
      .where('organization_id', '=', organizationId)
      .where('status', '!=', 'MAINTENANCE')
      .executeTakeFirst();

    const occupiedBedsCount = await this.db
      .selectFrom('beds')
      .select(sql<number>`count(*)::int`.as('occupied'))
      .where('organization_id', '=', organizationId)
      .where('status', '=', 'OCCUPIED')
      .executeTakeFirst();

    const totalBeds = bedsCount?.total || 0;
    const occupiedBeds = occupiedBedsCount?.occupied || 0;
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

    if (occupancyRate >= 90) {
      const dedupeKey = `HIGH_OCCUPANCY:${organizationId}`;
      const created = await this.notificationRepo.createIfNotExists(organizationId, {
        type: 'HIGH_OCCUPANCY',
        severity: 'INFO',
        title: 'High Occupancy Alert',
        message: `Property occupancy is at ${occupancyRate.toFixed(1)}% (${occupiedBeds}/${totalBeds} beds occupied).`,
        entity_type: 'ORGANIZATION',
        entity_id: organizationId,
        action_route: '/(owner)/dashboard',
        metadata: { occupancyRate, occupiedBeds, totalBeds },
        dedupe_key: dedupeKey,
        status: 'UNREAD',
        read_at: null,
        resolved_at: null,
        expires_at: null,
      });
      if (created) generatedCount++;
    } else {
      const activeHighOccupancyNotifs = await this.db
        .selectFrom('notifications')
        .selectAll()
        .where('organization_id', '=', organizationId)
        .where('type', '=', 'HIGH_OCCUPANCY')
        .where('status', 'in', ['UNREAD', 'READ'])
        .execute();

      for (const notif of activeHighOccupancyNotifs) {
        await this.notificationRepo.resolve(notif.id, organizationId);
        resolvedCount++;
      }
    }

    return { generatedCount, resolvedCount };
  }
}
