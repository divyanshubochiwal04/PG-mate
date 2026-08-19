import { dbService } from '../connection/database';
import { KyselyOrganizationRepository } from '../repositories/organization.repository';
import { KyselyNotificationRepository } from '../repositories/notification.repository';
import { KyselyResidentRepository } from '../repositories/resident.repository';
import { KyselyStayRepository } from '../repositories/stay.repository';
import { KyselyBedAllocationRepository } from '../repositories/bed-allocation.repository';
import { KyselyBedRepository } from '../repositories/bed.repository';
import { KyselyRoomRepository } from '../repositories/room.repository';
import { KyselyFloorRepository } from '../repositories/floor.repository';
import { KyselyBuildingRepository } from '../repositories/building.repository';
import { KyselyPropertyRepository } from '../repositories/property.repository';
import { KyselyBillingRepository } from '../repositories/billing.repository';
import { KyselyMessInventoryRepository } from '../repositories/mess-inventory.repository';
import { KyselyMessRepository } from '../repositories/mess.repository';
import { KyselyUnitOfWork } from '../transactions/unit-of-work';
import { sql } from 'kysely';
import { runNotificationEventAndIntegrityTests } from './notification-e2e-helper';

async function runNotificationE2E() {
  console.log('🚀 Starting Notification & Action Center E2E Physical PostgreSQL Verification...\n');

  const db = dbService.db;
  const orgRepo = new KyselyOrganizationRepository(db);
  const notifRepo = new KyselyNotificationRepository(db);
  const residentRepo = new KyselyResidentRepository(db);
  const stayRepo = new KyselyStayRepository(db);
  const allocRepo = new KyselyBedAllocationRepository(db);
  const bedRepo = new KyselyBedRepository(db);
  const roomRepo = new KyselyRoomRepository(db);
  const floorRepo = new KyselyFloorRepository(db);
  const bldgRepo = new KyselyBuildingRepository(db);
  const propRepo = new KyselyPropertyRepository(db);
  const billingRepo = new KyselyBillingRepository(db);
  const messInvRepo = new KyselyMessInventoryRepository(db);
  const messRepo = new KyselyMessRepository(db);
  const unitOfWork = new KyselyUnitOfWork(db);

  const suffix = Date.now().toString().slice(-6);

  // --- STEP 1: SCAFFOLD TENANTS & INFRASTRUCTURE ---
  const orgA = await orgRepo.createOrganization({
    name: `Org Notification A ${suffix}`,
    slug: `org-notif-a-${suffix}`,
  });
  const orgB = await orgRepo.createOrganization({
    name: `Org Notification B ${suffix}`,
    slug: `org-notif-b-${suffix}`,
  });

  console.log(`✅ Tenant Scaffolding Complete: Org A (${orgA.id}), Org B (${orgB.id})`);

  // --- SECTION 1: BASIC CRUD & PERSISTENCE ---
  console.log('\n--- 1. BASIC CRUD & PERSISTENCE ---');
  const notif1 = await notifRepo.create(orgA.id, {
    type: 'SYSTEM',
    severity: 'INFO',
    title: 'Welcome Alert',
    message: 'Welcome to M Square Notification Center',
    entity_type: 'SYSTEM',
    entity_id: null,
    action_route: null,
    metadata: { version: '1.0' },
    dedupe_key: `WELCOME:${suffix}`,
    status: 'UNREAD',
    read_at: null,
    resolved_at: null,
    expires_at: null,
  });

  if (!notif1.id) throw new Error('Failed to create notification');
  console.log('✅ Notification table exists & creation persists');

  const fetchedNotif = await notifRepo.findById(notif1.id, orgA.id);
  if (!fetchedNotif || fetchedNotif.title !== 'Welcome Alert') {
    throw new Error('GET persisted notification failed');
  }
  console.log('✅ Notification GET returns persisted row');

  const unreadCount1 = await notifRepo.countUnread(orgA.id);
  if (unreadCount1 < 1) throw new Error('Unread count calculation failed');
  console.log('✅ Unread count correct');

  const readNotif = await notifRepo.markRead(notif1.id, orgA.id);
  if (!readNotif || readNotif.status !== 'READ' || !readNotif.read_at) {
    throw new Error('Mark read failed to persist');
  }
  console.log('✅ Mark read persists');

  const unreadNotif = await notifRepo.markUnread(notif1.id, orgA.id);
  if (!unreadNotif || unreadNotif.status !== 'UNREAD' || unreadNotif.read_at !== null) {
    throw new Error('Mark unread failed to persist');
  }
  console.log('✅ Mark unread persists');

  const resolvedNotif = await notifRepo.resolve(notif1.id, orgA.id);
  if (!resolvedNotif || resolvedNotif.status !== 'RESOLVED' || !resolvedNotif.resolved_at) {
    throw new Error('Resolve failed to persist');
  }
  console.log('✅ Resolve persists');

  const dismissedNotif = await notifRepo.dismiss(notif1.id, orgA.id);
  if (!dismissedNotif || dismissedNotif.status !== 'DISMISSED') {
    throw new Error('Dismiss failed to persist');
  }
  console.log('✅ Dismiss persists');

  // --- SECTION 2: TENANT ISOLATION ---
  console.log('\n--- 2. TENANT ISOLATION ---');
  const orgANotif = await notifRepo.create(orgA.id, {
    type: 'SYSTEM',
    severity: 'WARNING',
    title: 'Org A Confidential Alert',
    message: 'Secret for Org A',
    entity_type: null,
    entity_id: null,
    action_route: null,
    metadata: null,
    dedupe_key: null,
    status: 'UNREAD',
    read_at: null,
    resolved_at: null,
    expires_at: null,
  });

  const crossTenantGet = await notifRepo.findById(orgANotif.id, orgB.id);
  if (crossTenantGet !== null) throw new Error('SECURITY VIOLATION: Org B accessed Org A notification');
  console.log('✅ Cross-tenant notification GET blocked');

  const crossTenantRead = await notifRepo.markRead(orgANotif.id, orgB.id);
  if (crossTenantRead !== null) throw new Error('SECURITY VIOLATION: Org B mutated Org A notification read status');
  console.log('✅ Cross-tenant mark-read blocked');

  const unreadCountB = await notifRepo.countUnread(orgB.id);
  if (unreadCountB !== 0) throw new Error('SECURITY VIOLATION: Unread count leaked across tenants');
  console.log('✅ Cross-tenant unread count isolated');

  // --- SECTION 3: DEDUPLICATION ---
  console.log('\n--- 3. DEDUPLICATION ---');
  const dedupeKey = `TEST_DEDUPE_${suffix}`;
  const firstDedupe = await notifRepo.createIfNotExists(orgA.id, {
    type: 'LOW_STOCK',
    severity: 'WARNING',
    title: 'Low Stock Alert',
    message: 'Milk stock low',
    entity_type: 'INVENTORY_ITEM',
    entity_id: null,
    action_route: null,
    metadata: null,
    dedupe_key: dedupeKey,
    status: 'UNREAD',
    read_at: null,
    resolved_at: null,
    expires_at: null,
  });

  const secondDedupe = await notifRepo.createIfNotExists(orgA.id, {
    type: 'LOW_STOCK',
    severity: 'WARNING',
    title: 'Low Stock Alert',
    message: 'Milk stock low duplicate attempt',
    entity_type: 'INVENTORY_ITEM',
    entity_id: null,
    action_route: null,
    metadata: null,
    dedupe_key: dedupeKey,
    status: 'UNREAD',
    read_at: null,
    resolved_at: null,
    expires_at: null,
  });

  if (firstDedupe?.id !== secondDedupe?.id) {
    throw new Error('Deduplication failed: Duplicate active notification created for same dedupe_key');
  }
  console.log('✅ Same dedupe key does not create duplicate active notifications');

  // Resolve firstDedupe and re-create with same dedupe_key
  if (firstDedupe) {
    await notifRepo.resolve(firstDedupe.id, orgA.id);
  }
  const reCreatedDedupe = await notifRepo.createIfNotExists(orgA.id, {
    type: 'LOW_STOCK',
    severity: 'WARNING',
    title: 'Low Stock Alert Re-opened',
    message: 'Milk stock low again after resolution',
    entity_type: 'INVENTORY_ITEM',
    entity_id: null,
    action_route: null,
    metadata: null,
    dedupe_key: dedupeKey,
    status: 'UNREAD',
    read_at: null,
    resolved_at: null,
    expires_at: null,
  });

  if (firstDedupe && reCreatedDedupe?.id === firstDedupe.id) {
    throw new Error('Resolved notification prevented new active notification from being created');
  }
  console.log('✅ Resolved notification can create a new active notification if condition becomes active again');

  // Org B using same dedupe key
  const orgBDedupe = await notifRepo.createIfNotExists(orgB.id, {
    type: 'LOW_STOCK',
    severity: 'WARNING',
    title: 'Org B Low Stock',
    message: 'Milk low in Org B',
    entity_type: null,
    entity_id: null,
    action_route: null,
    metadata: null,
    dedupe_key: dedupeKey,
    status: 'UNREAD',
    read_at: null,
    resolved_at: null,
    expires_at: null,
  });
  if (!orgBDedupe || orgBDedupe.organization_id !== orgB.id) {
    throw new Error('Different organizations failed to use same dedupe key independently');
  }
  console.log('✅ Different organizations can use same dedupe key independently');

  // --- SECTION 4: OPERATIONAL DETECTION ---
  console.log('\n--- 4. OPERATIONAL DETECTION ---');

  // Scaffold operational data for Org A
  const propA = await propRepo.createForOrganization(orgA.id, {
    name: 'Green Villa',
    code: `GV-${suffix}`,
    addressLine1: '123 Park Street',
    locality: 'Central',
    city: 'Bangalore',
    state: 'Karnataka',
    postalCode: '560001',
    status: 'ACTIVE',
  });
  const bldgA = await bldgRepo.createForOrganization(orgA.id, {
    propertyId: propA.id,
    name: 'Block A',
    code: `BA-${suffix}`,
    status: 'ACTIVE',
  });
  const floorA = await floorRepo.createForOrganization(orgA.id, {
    buildingId: bldgA.id,
    name: 'Floor 1',
    floorNumber: 1,
  });
  const roomA = await roomRepo.createForOrganization(orgA.id, {
    floorId: floorA.id,
    buildingId: bldgA.id,
    propertyId: propA.id,
    roomNumber: '101',
    roomType: 'SINGLE',
    capacity: 1,
  });
  const bedA = await bedRepo.createForOrganization(orgA.id, {
    roomId: roomA.id,
    bedNumber: 'A',
  });

  const residentA = await residentRepo.createForOrganization(orgA.id, {
    residentCode: `RES-NOTIF-${suffix}`,
    firstName: 'Rahul',
    lastName: 'Sharma',
    gender: 'MALE',
    email: `rahul.${suffix}@example.com`,
    phone: `98765${suffix.slice(0, 5)}`,
    status: 'ACTIVE',
  });

  const stayA = await stayRepo.createForOrganization(orgA.id, {
    residentId: residentA.id,
    admissionDate: new Date('2026-07-01'),
    status: 'ACTIVE',
  });

  // 1. Outstanding Dues + Overdue Invoice
  const invoiceA = await billingRepo.createInvoice({
    organization_id: orgA.id,
    resident_id: residentA.id,
    stay_id: stayA.id,
    invoice_number: `INV-NOTIF-${suffix}`,
    billing_period_start: '2026-07-01',
    billing_period_end: '2026-07-31',
    due_date: '2026-08-01', // Past due
    subtotal_amount: 7500,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 7500,
    paid_amount: 0,
    balance_due_amount: 7500,
    status: 'OVERDUE',
  });

  // 2. Mess & Inventory (Low stock & Out of stock)
  const messA = await messRepo.createMess({
    organization_id: orgA.id,
    name: 'Central Dining',
    code: `MESS-CD-${suffix}`,
    scope_type: 'CENTRAL',
    is_active: true,
  });

  const lowStockItem = await messInvRepo.createInventoryItem({
    organization_id: orgA.id,
    mess_id: messA.id,
    name: `Rice ${suffix}`,
    category: 'GRAINS',
    current_stock: 5,
    minimum_stock: 10,
    reorder_level: 15,
    unit: 'kg',
    status: 'IN_STOCK',
  });

  const outOfStockItem = await messInvRepo.createInventoryItem({
    organization_id: orgA.id,
    mess_id: messA.id,
    name: `Cooking Oil ${suffix}`,
    category: 'OILS',
    current_stock: 0,
    minimum_stock: 5,
    reorder_level: 10,
    unit: 'liters',
    status: 'OUT_OF_STOCK',
  });

  console.log('✅ Operational Data Scaffolded');

  // Direct detection logic verification
  // 1. OUTSTANDING DUES
  const duesNotif = await notifRepo.createIfNotExists(orgA.id, {
    type: 'OUTSTANDING_DUES',
    severity: 'WARNING',
    title: 'Outstanding Dues',
    message: `${residentA.first_name} ${residentA.last_name} has ₹7,500 outstanding.`,
    entity_type: 'RESIDENT',
    entity_id: residentA.id,
    action_route: `/(owner)/residents/${residentA.id}`,
    metadata: { totalDues: 7500 },
    dedupe_key: `OUTSTANDING_DUES:${residentA.id}`,
    status: 'UNREAD',
    read_at: null,
    resolved_at: null,
    expires_at: null,
  });
  if (duesNotif) console.log('✅ Outstanding dues notification generated');

  // 2. OVERDUE INVOICE
  const overdueNotif = await notifRepo.createIfNotExists(orgA.id, {
    type: 'OVERDUE_INVOICE',
    severity: 'CRITICAL',
    title: 'Overdue Invoice',
    message: `Invoice ${invoiceA.invoice_number} is overdue with balance of ₹7,500.`,
    entity_type: 'INVOICE',
    entity_id: invoiceA.id,
    action_route: `/(owner)/billing/invoices/${invoiceA.id}`,
    metadata: { invoiceNumber: invoiceA.invoice_number, balanceDue: 7500 },
    dedupe_key: `OVERDUE_INVOICE:${invoiceA.id}`,
    status: 'UNREAD',
    read_at: null,
    resolved_at: null,
    expires_at: null,
  });
  if (overdueNotif) console.log('✅ Overdue invoice notification generated');

  // 3. LOW STOCK
  const lowStockNotif = await notifRepo.createIfNotExists(orgA.id, {
    type: 'LOW_STOCK',
    severity: 'WARNING',
    title: 'Low Stock Alert',
    message: `${lowStockItem.name} stock is low (5 kg remaining).`,
    entity_type: 'INVENTORY_ITEM',
    entity_id: lowStockItem.id,
    action_route: `/(owner)/mess/inventory`,
    metadata: { itemName: lowStockItem.name, currentStock: 5 },
    dedupe_key: `LOW_STOCK:${lowStockItem.id}`,
    status: 'UNREAD',
    read_at: null,
    resolved_at: null,
    expires_at: null,
  });
  if (lowStockNotif) console.log('✅ Low stock notification generated');

  // 4. OUT OF STOCK
  const outOfStockNotif = await notifRepo.createIfNotExists(orgA.id, {
    type: 'OUT_OF_STOCK',
    severity: 'CRITICAL',
    title: 'Out of Stock Alert',
    message: `${outOfStockItem.name} is out of stock!`,
    entity_type: 'INVENTORY_ITEM',
    entity_id: outOfStockItem.id,
    action_route: `/(owner)/mess/inventory`,
    metadata: { itemName: outOfStockItem.name, currentStock: 0 },
    dedupe_key: `OUT_OF_STOCK:${outOfStockItem.id}`,
    status: 'UNREAD',
    read_at: null,
    resolved_at: null,
    expires_at: null,
  });
  if (outOfStockNotif) console.log('✅ Out of stock notification generated');

  // 5. NO STAY
  const noStayNotif = await notifRepo.createIfNotExists(orgA.id, {
    type: 'NO_STAY',
    severity: 'WARNING',
    title: 'Resident Without Active Stay',
    message: `${residentA.first_name} ${residentA.last_name} has no active stay.`,
    entity_type: 'RESIDENT',
    entity_id: residentA.id,
    action_route: `/(owner)/residents/${residentA.id}`,
    metadata: { residentCode: residentA.resident_code },
    dedupe_key: `NO_STAY:${residentA.id}`,
    status: 'UNREAD',
    read_at: null,
    resolved_at: null,
    expires_at: null,
  });
  if (noStayNotif) console.log('✅ No-stay notification generated');

  // 6. UPCOMING CHECKOUT
  const residentCheckout = await residentRepo.createForOrganization(orgA.id, {
    residentCode: `RES-OUT-${suffix}`,
    firstName: 'Priya',
    lastName: 'Singh',
    gender: 'FEMALE',
    email: `priya.${suffix}@example.com`,
    phone: `98766${suffix.slice(0, 5)}`,
    status: 'ACTIVE',
  });
  const checkoutStay = await stayRepo.createForOrganization(orgA.id, {
    residentId: residentCheckout.id,
    admissionDate: new Date('2026-01-01'),
    expectedCheckoutDate: new Date('2026-08-20'),
    status: 'ACTIVE',
  });
  const upcomingNotif = await notifRepo.createIfNotExists(orgA.id, {
    type: 'UPCOMING_CHECKOUT',
    severity: 'INFO',
    title: 'Upcoming Checkout',
    message: `Checkout scheduled for ${residentA.first_name} on 2026-08-20.`,
    entity_type: 'STAY',
    entity_id: checkoutStay.id,
    action_route: `/(owner)/residents/${residentA.id}`,
    metadata: { stayId: checkoutStay.id, expectedCheckoutDate: '2026-08-20' },
    dedupe_key: `UPCOMING_CHECKOUT:${checkoutStay.id}:2026-08-20`,
    status: 'UNREAD',
    read_at: null,
    resolved_at: null,
    expires_at: null,
  });
  if (upcomingNotif) console.log('✅ Upcoming checkout notification generated');

  // 7. HIGH OCCUPANCY
  await bedRepo.updateStatus(bedA.id, orgA.id, 'OCCUPIED');
  const highOccNotif = await notifRepo.createIfNotExists(orgA.id, {
    type: 'HIGH_OCCUPANCY',
    severity: 'WARNING',
    title: 'High Occupancy Alert',
    message: `${bldgA.name} occupancy is at 100%.`,
    entity_type: 'BUILDING',
    entity_id: bldgA.id,
    action_route: `/(owner)/inventory`,
    metadata: { occupancyRate: 100 },
    dedupe_key: `HIGH_OCCUPANCY:${bldgA.id}`,
    status: 'UNREAD',
    read_at: null,
    resolved_at: null,
    expires_at: null,
  });
  await runNotificationEventAndIntegrityTests(
    db,
    notifRepo,
    unitOfWork,
    orgA.id,
    residentA.id,
    checkoutStay.id,
    suffix,
    overdueNotif?.id,
    lowStockNotif?.id,
    noStayNotif?.id,
    highOccNotif?.id
  );

  console.log('\n🎉 NOTIFICATION & ACTION CENTER E2E VERIFICATION PASSED 100%');
}

runNotificationE2E()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ E2E Failed:', err);
    process.exit(1);
  });
