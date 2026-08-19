import { dbService } from '../connection/database';
import { KyselyReportingRepository } from '../repositories/reporting.repository';
import { KyselyOrganizationRepository } from '../repositories/organization.repository';
import { KyselyRoomRepository } from '../repositories/room.repository';
import { KyselyBedRepository } from '../repositories/bed.repository';
import { KyselyResidentRepository } from '../repositories/resident.repository';
import { KyselyStayRepository } from '../repositories/stay.repository';
import { KyselyBedAllocationRepository } from '../repositories/bed-allocation.repository';
import { KyselyBillingRepository } from '../repositories/billing.repository';
import { KyselyMessRepository } from '../repositories/mess.repository';
import { KyselyMessInventoryRepository } from '../repositories/mess-inventory.repository';

async function runOwnerDashboardE2E() {
  console.log('🚀 Starting Phase 20: Owner Command Center & Business Operations Dashboard Physical PostgreSQL E2E...');

  const db = dbService.db;
  const orgRepo = new KyselyOrganizationRepository(db);
  const roomRepo = new KyselyRoomRepository(db);
  const bedRepo = new KyselyBedRepository(db);
  const resRepo = new KyselyResidentRepository(db);
  const stayRepo = new KyselyStayRepository(db);
  const allocRepo = new KyselyBedAllocationRepository(db);
  const billRepo = new KyselyBillingRepository(db);
  const messRepo = new KyselyMessRepository(db);
  const invRepo = new KyselyMessInventoryRepository(db);
  const reportRepo = new KyselyReportingRepository(db);

  const suffix = Math.random().toString(36).substring(2, 7);

  // 1. Scaffold Org A (Active Tenant)
  const orgA = await orgRepo.createOrganization({
    name: `Owner Dash Org A ${suffix}`,
    slug: `dash-org-a-${suffix}`,
  });

  // Scaffold Org B (Isolated Tenant)
  const orgB = await orgRepo.createOrganization({
    name: `Owner Dash Org B ${suffix}`,
    slug: `dash-org-b-${suffix}`,
  });

  // Scaffold Org C (Empty Tenant)
  const orgC = await orgRepo.createOrganization({
    name: `Owner Dash Org C ${suffix}`,
    slug: `dash-org-c-${suffix}`,
  });

  // Org A: 2 Properties
  const prop1 = await db
    .insertInto('properties')
    .values({
      organization_id: orgA.id,
      name: `Grand Residency ${suffix}`,
      code: `GR-${suffix}`,
      address_line1: '100 Main St',
      locality: 'Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      postal_code: '560001',
      status: 'ACTIVE',
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  const prop2 = await db
    .insertInto('properties')
    .values({
      organization_id: orgA.id,
      name: `Lakeside Villa ${suffix}`,
      code: `LV-${suffix}`,
      address_line1: '200 Lake Rd',
      locality: 'Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      postal_code: '560002',
      status: 'ACTIVE',
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  // Org A: Buildings
  const bldg1 = await db
    .insertInto('buildings')
    .values({
      organization_id: orgA.id,
      property_id: prop1.id,
      name: `Block A`,
      code: `BLK-A`,
      status: 'ACTIVE',
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  const bldg2 = await db
    .insertInto('buildings')
    .values({
      organization_id: orgA.id,
      property_id: prop2.id,
      name: `Block B`,
      code: `BLK-B`,
      status: 'ACTIVE',
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  // Floors & Rooms
  const flr1 = await db
    .insertInto('floors')
    .values({
      organization_id: orgA.id,
      building_id: bldg1.id,
      floor_number: 1,
      name: '1st Floor',
      status: 'ACTIVE',
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  const rm1 = await roomRepo.createForOrganization(orgA.id, {
    floorId: flr1.id,
    buildingId: bldg1.id,
    propertyId: prop1.id,
    roomNumber: `101-${suffix}`,
    roomType: 'DOUBLE',
    capacity: 2,
  });

  const rm2 = await roomRepo.createForOrganization(orgA.id, {
    floorId: flr1.id,
    buildingId: bldg1.id,
    propertyId: prop1.id,
    roomNumber: `102-${suffix}`,
    roomType: 'DOUBLE',
    capacity: 2,
  });

  // Beds (Total 4 Beds)
  const bd1 = await bedRepo.createForOrganization(orgA.id, {
    roomId: rm1.id,
    bedNumber: '101-A',
  });

  const bd2 = await bedRepo.createForOrganization(orgA.id, {
    roomId: rm1.id,
    bedNumber: '101-B',
  });

  const bd3 = await bedRepo.createForOrganization(orgA.id, {
    roomId: rm2.id,
    bedNumber: '102-A',
  });

  const bd4 = await bedRepo.createForOrganization(orgA.id, {
    roomId: rm2.id,
    bedNumber: '102-B',
  });

  // Residents & Stays
  const res1 = await resRepo.createForOrganization(orgA.id, {
    firstName: 'Rahul',
    lastName: 'Sharma',
    gender: 'MALE',
    phone: '9111111111',
    email: `rahul-${suffix}@test.com`,
    residentCode: `RES1-${suffix}`,
    status: 'ACTIVE',
  });

  const stay1 = await stayRepo.createForOrganization(orgA.id, {
    residentId: res1.id,
    admissionDate: new Date('2026-08-01'),
    status: 'ACTIVE',
  });

  await allocRepo.createForOrganization(orgA.id, {
    stayId: stay1.id,
    bedId: bd1.id,
    startAt: new Date('2026-08-01'),
    status: 'ACTIVE',
  });
  await db.updateTable('beds').set({ status: 'OCCUPIED' }).where('id', '=', bd1.id).execute();

  const res2 = await resRepo.createForOrganization(orgA.id, {
    firstName: 'Ananya',
    lastName: 'Roy',
    gender: 'FEMALE',
    phone: '9222222222',
    email: `ananya-${suffix}@test.com`,
    residentCode: `RES2-${suffix}`,
    status: 'ACTIVE',
  });

  const stay2 = await stayRepo.createForOrganization(orgA.id, {
    residentId: res2.id,
    admissionDate: new Date('2026-08-01'),
    status: 'ACTIVE',
  });

  await allocRepo.createForOrganization(orgA.id, {
    stayId: stay2.id,
    bedId: bd2.id,
    startAt: new Date('2026-08-01'),
    status: 'ACTIVE',
  });
  await db.updateTable('beds').set({ status: 'OCCUPIED' }).where('id', '=', bd2.id).execute();

  // Resident 3: Checked Out (COMPLETED status)
  const res3 = await resRepo.createForOrganization(orgA.id, {
    firstName: 'Vikram',
    lastName: 'Singh',
    gender: 'MALE',
    phone: '9333333333',
    email: `vikram-${suffix}@test.com`,
    residentCode: `RES3-${suffix}`,
    status: 'INACTIVE',
  });

  const stay3 = await db
    .insertInto('stays')
    .values({
      organization_id: orgA.id,
      resident_id: res3.id,
      admission_date: new Date('2026-07-01'),
      actual_checkout_date: new Date('2026-08-01'),
      status: 'COMPLETED',
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  // Resident 4: Registered without Stay
  const res4 = await resRepo.createForOrganization(orgA.id, {
    firstName: 'Pooja',
    lastName: 'Mehta',
    gender: 'FEMALE',
    phone: '9444444444',
    email: `pooja-${suffix}@test.com`,
    residentCode: `RES4-${suffix}`,
    status: 'ACTIVE',
  });

  // Mess Subscriptions
  const mess1 = await messRepo.createMess({
    organization_id: orgA.id,
    name: `Central Mess ${suffix}`,
    code: `CM-${suffix}`,
    scope_type: 'CENTRAL',
    is_active: true,
  });

  const plan1 = await messRepo.createMealPlan({
    organization_id: orgA.id,
    mess_id: mess1.id,
    name: '3 Meals Daily',
    description: null,
    billing_mode: 'MONTHLY',
    price: 4500,
    included_meal_types: 'ALL',
    is_active: true,
  });

  await messRepo.createSubscription({
    organization_id: orgA.id,
    resident_id: res1.id,
    stay_id: stay1.id,
    mess_id: mess1.id,
    meal_plan_id: plan1.id,
    billing_mode: 'MONTHLY',
    price_at_subscription: 4500,
    status: 'ACTIVE',
    start_date: '2026-08-01',
    end_date: null,
  });

  // Invoices & Payments
  const inv1 = await billRepo.createInvoice({
    organization_id: orgA.id,
    stay_id: stay1.id,
    resident_id: res1.id,
    invoice_number: `INV-${suffix}-01`,
    billing_period_start: '2026-08-01',
    billing_period_end: '2026-08-31',
    due_date: '2026-08-10',
    subtotal_amount: 12500,
    total_amount: 12500,
    paid_amount: 5000,
    balance_due_amount: 7500,
    status: 'PARTIALLY_PAID',
  });

  const inv2 = await billRepo.createInvoice({
    organization_id: orgA.id,
    stay_id: stay2.id,
    resident_id: res2.id,
    invoice_number: `INV-${suffix}-02`,
    billing_period_start: '2026-08-01',
    billing_period_end: '2026-08-31',
    due_date: '2026-08-05',
    subtotal_amount: 8000,
    total_amount: 8000,
    paid_amount: 0,
    balance_due_amount: 8000,
    status: 'OVERDUE',
  });

  await billRepo.createPayment({
    organization_id: orgA.id,
    stay_id: stay1.id,
    resident_id: res1.id,
    payment_number: `PAY-${suffix}-01`,
    payment_date: '2026-08-02',
    amount: 5000,
    payment_method: 'UPI',
    reference_number: 'UPI98231',
    idempotency_key: `IK-${suffix}-01`,
  });

  // Inventory Items
  const item1 = await invRepo.createInventoryItem({
    organization_id: orgA.id,
    mess_id: mess1.id,
    name: `Basmati Rice ${suffix}`,
    category: 'GRAINS',
    unit: 'kg',
    current_stock: 50,
    minimum_stock: 10,
    reorder_level: 20,
    status: 'IN_STOCK',
  });

  const item2 = await invRepo.createInventoryItem({
    organization_id: orgA.id,
    mess_id: mess1.id,
    name: `Cooking Oil ${suffix}`,
    category: 'OILS',
    unit: 'litre',
    current_stock: 5,
    minimum_stock: 10,
    reorder_level: 15,
    status: 'LOW_STOCK',
  });

  const item3 = await invRepo.createInventoryItem({
    organization_id: orgA.id,
    mess_id: mess1.id,
    name: `Gas Cylinder ${suffix}`,
    category: 'FUEL',
    unit: 'cylinder',
    current_stock: 0,
    minimum_stock: 2,
    reorder_level: 5,
    status: 'OUT_OF_STOCK',
  });

  // Expenses
  await invRepo.createExpense({
    organization_id: orgA.id,
    mess_id: mess1.id,
    category: 'GAS',
    amount: 1800,
    expense_date: '2026-08-08',
    vendor_id: null,
    reference_no: null,
    notes: 'Commercial Cylinder Refill',
  });

  // Org B Setup (Isolated)
  const propB = await db
    .insertInto('properties')
    .values({
      organization_id: orgB.id,
      name: `Org B Residency ${suffix}`,
      code: `OB-${suffix}`,
      address_line1: '999 Remote St',
      locality: 'HSR Layout',
      city: 'Bangalore',
      state: 'Karnataka',
      postal_code: '560099',
      status: 'ACTIVE',
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  console.log('✅ Scaffolding complete for Org A (Active), Org B (Isolated), and Org C (Empty)');

  // EXECUTE VERIFICATIONS

  // STEP 1: Property Count
  const occA = await reportRepo.getOccupancyMetrics(orgA.id);
  if (occA.totalProperties !== 2) throw new Error(`Expected 2 properties, got ${occA.totalProperties}`);
  console.log('✅ STEP 1: Property count verified (2 properties)');

  // STEP 2: Building Count
  if (occA.totalBuildings !== 2) throw new Error(`Expected 2 buildings, got ${occA.totalBuildings}`);
  console.log('✅ STEP 2: Building count verified (2 buildings)');

  // STEP 3: Room Count
  if (occA.totalRooms !== 2) throw new Error(`Expected 2 rooms, got ${occA.totalRooms}`);
  console.log('✅ STEP 3: Room count verified (2 rooms)');

  // STEP 4: Bed Count
  if (occA.totalBeds !== 4) throw new Error(`Expected 4 beds, got ${occA.totalBeds}`);
  console.log('✅ STEP 4: Bed count verified (4 beds)');

  // STEP 5: Occupied Beds
  if (occA.occupiedBeds !== 2) throw new Error(`Expected 2 occupied beds, got ${occA.occupiedBeds}`);
  console.log('✅ STEP 5: Occupied beds verified (2 occupied)');

  // STEP 6: Available Beds
  if (occA.availableBeds !== 2) throw new Error(`Expected 2 available beds, got ${occA.availableBeds}`);
  console.log('✅ STEP 6: Available beds verified (2 available)');

  // STEP 7: Occupancy Percentage
  if (occA.occupancyPercentage !== 50) throw new Error(`Expected 50% occupancy, got ${occA.occupancyPercentage}%`);
  console.log('✅ STEP 7: Occupancy percentage verified (50%)');

  // STEP 8: Total Residents
  const resMetricsA = await reportRepo.getResidentMetrics(orgA.id);
  if (resMetricsA.totalActiveResidents !== 3) throw new Error(`Expected 3 active residents, got ${resMetricsA.totalActiveResidents}`);
  console.log('✅ STEP 8: Total active residents verified (3 active)');

  // STEP 9: Active Residents
  if (resMetricsA.currentCheckedInResidents !== 2) throw new Error(`Expected 2 current checked-in, got ${resMetricsA.currentCheckedInResidents}`);
  console.log('✅ STEP 9: Current checked-in residents verified (2 checked-in)');

  // STEP 10: Checked-Out Residents
  if (resMetricsA.checkedOutResidents !== 1) throw new Error(`Expected 1 checked out, got ${resMetricsA.checkedOutResidents}`);
  console.log('✅ STEP 10: Checked-out residents verified (1 checked-out)');

  // STEP 11: Residents Without Stay
  if (resMetricsA.residentsWithoutStay !== 1) throw new Error(`Expected 1 resident without stay, got ${resMetricsA.residentsWithoutStay}`);
  console.log('✅ STEP 11: Residents without stay verified (1 without stay)');

  // STEP 12: Active Mess Subscribers
  const messMetricsA = await reportRepo.getMessMetrics(orgA.id);
  if (messMetricsA.activeMessSubscribers !== 1) throw new Error(`Expected 1 active mess subscriber, got ${messMetricsA.activeMessSubscribers}`);
  console.log('✅ STEP 12: Active mess subscribers verified (1 subscriber)');

  // STEP 13: Total Invoiced
  const billMetricsA = await reportRepo.getBillingMetrics(orgA.id);
  if (billMetricsA.totalInvoicedPaise !== 2050000) throw new Error(`Expected 2050000 paise (₹20,500), got ${billMetricsA.totalInvoicedPaise}`);
  console.log('✅ STEP 13: Total invoiced verified (₹20,500)');

  // STEP 14: Total Collected
  if (billMetricsA.totalCollectedPaise !== 500000) throw new Error(`Expected 500000 paise (₹5,000), got ${billMetricsA.totalCollectedPaise}`);
  console.log('✅ STEP 14: Total collected verified (₹5,000)');

  // STEP 15: Outstanding Dues
  if (billMetricsA.totalOutstandingPaise !== 1550000) throw new Error(`Expected 1550000 paise (₹15,500), got ${billMetricsA.totalOutstandingPaise}`);
  console.log('✅ STEP 15: Outstanding dues verified (₹15,500)');

  // STEP 16: Overdue Invoices
  if (billMetricsA.overdueInvoiceCount !== 1) throw new Error(`Expected 1 overdue invoice, got ${billMetricsA.overdueInvoiceCount}`);
  console.log('✅ STEP 16: Overdue invoices verified (1 overdue)');

  // STEP 17: Inventory Item Count
  if (messMetricsA.totalInventoryItems !== 3) throw new Error(`Expected 3 inventory items, got ${messMetricsA.totalInventoryItems}`);
  console.log('✅ STEP 17: Inventory item count verified (3 items)');

  // STEP 18: Low Stock Count
  if (messMetricsA.lowStockItemCount !== 1) throw new Error(`Expected 1 low stock item, got ${messMetricsA.lowStockItemCount}`);
  console.log('✅ STEP 18: Low stock count verified (1 low stock item)');

  // STEP 19: Out of Stock Count
  if (messMetricsA.outOfStockItemCount !== 1) throw new Error(`Expected 1 out of stock item, got ${messMetricsA.outOfStockItemCount}`);
  console.log('✅ STEP 19: Out of stock count verified (1 out of stock item)');

  // STEP 20: Expense Total
  const expMetricsA = await reportRepo.getExpenseMetrics(orgA.id);
  if (expMetricsA.currentMonthExpensesPaise !== 180000) throw new Error(`Expected 180000 paise (₹1,800), got ${expMetricsA.currentMonthExpensesPaise}`);
  console.log('✅ STEP 20: Expense total verified (₹1,800)');

  // STEP 21: Property Filter Accuracy
  const occProp1 = await reportRepo.getOccupancyMetrics(orgA.id, prop1.id);
  if (occProp1.totalBuildings !== 1 || occProp1.totalBeds !== 4) {
    throw new Error('Property filter accuracy failed');
  }
  console.log('✅ STEP 21: Property filter accuracy verified');

  // STEP 22: Building Filter Accuracy
  const occBldg1 = await reportRepo.getOccupancyMetrics(orgA.id, prop1.id, bldg1.id);
  if (occBldg1.totalBuildings !== 1 || occBldg1.totalBeds !== 4) {
    throw new Error('Building filter accuracy failed');
  }
  console.log('✅ STEP 22: Building filter accuracy verified');

  // STEP 23: Period Filter Accuracy
  const billPeriod = await reportRepo.getBillingMetrics(orgA.id, prop1.id, undefined, '2026-08-01T00:00:00.000Z', '2026-08-31T23:59:59.999Z');
  if (billPeriod.totalInvoicedPaise !== 2050000) throw new Error('Period filter accuracy failed');
  console.log('✅ STEP 23: Period filter accuracy verified (2026-08)');

  // STEP 24: Cross-Tenant Isolation
  const occB = await reportRepo.getOccupancyMetrics(orgB.id);
  if (occB.totalProperties !== 1 || occB.totalBeds !== 0 || occB.occupiedBeds !== 0) {
    throw new Error('Cross-tenant isolation failed for Org B!');
  }
  console.log('✅ STEP 24: Cross-tenant isolation verified (Org B metrics isolated)');

  // STEP 25: Deterministic Aggregate Results
  const occA_retry = await reportRepo.getOccupancyMetrics(orgA.id);
  if (JSON.stringify(occA) !== JSON.stringify(occA_retry)) {
    throw new Error('Non-deterministic query result detected');
  }
  console.log('✅ STEP 25: Deterministic aggregate results verified');

  // STEP 26: Zero Duplicate Aggregate Rows
  if (occA.totalBeds !== 4 || occA.occupiedBeds !== 2) {
    throw new Error('Duplicate join row amplification detected');
  }
  console.log('✅ STEP 26: Zero duplicate aggregate row amplification verified');

  // STEP 27: Fresh GET Matches PostgreSQL
  const alertsA = await reportRepo.getOperationalAlerts(orgA.id);
  if (alertsA.length < 3) throw new Error(`Expected at least 3 operational alerts, got ${alertsA.length}`);
  console.log('✅ STEP 27: Fresh GET operational alerts match PostgreSQL state');

  // STEP 28: Empty Tenant Returns Zero-Safe Metrics
  const occC = await reportRepo.getOccupancyMetrics(orgC.id);
  if (
    occC.totalProperties !== 0 ||
    occC.totalBeds !== 0 ||
    occC.occupiedBeds !== 0 ||
    occC.occupancyPercentage !== 0
  ) {
    throw new Error('Empty tenant zero-safe metric failure!');
  }
  console.log('✅ STEP 28: Empty tenant returns zero-safe metrics (0 properties, 0 beds, 0% occupancy)');

  console.log('\n🎉 OWNER DASHBOARD E2E VERIFICATION PASSED 100%\n');
  await dbService.shutdown();
}

runOwnerDashboardE2E()
  .then(() => {
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ E2E Execution Failed:', err);
    await dbService.shutdown();
    process.exit(1);
  });
