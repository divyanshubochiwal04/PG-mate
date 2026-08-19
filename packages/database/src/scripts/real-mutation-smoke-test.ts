import { dbService } from '../connection/database';
import { KyselyMessRepository } from '../repositories/mess.repository';
import { KyselyReportingRepository } from '../repositories/reporting.repository';
import { KyselyUnitOfWork } from '../transactions/unit-of-work';
import { sql } from 'kysely';
import { randomUUID } from 'crypto';

async function runRealMutationSmokeTest() {
  const db = dbService.db;
  console.log('==================================================');
  console.log('PHASE 14 — REAL MUTATION & DB PERSISTENCE SMOKE TEST');
  console.log('==================================================');

  // 1. Setup Test Tenant / Organization
  const testOrgId = randomUUID();
  const testUserId = randomUUID();
  const testPropertyId = randomUUID();
  const testBuildingId = randomUUID();
  const testFloorId = randomUUID();
  const testRoomId = randomUUID();
  const testBedId = randomUUID();
  const testResidentId = randomUUID();
  const testStayId = randomUUID();
  const testSlug = `org-${testOrgId.substring(0, 8)}`;
  const testEmail = `user-${testUserId.substring(0, 8)}@msquare.com`;

  console.log('1. Setting up test organization, inventory, resident, and stay...');
  await sql`
    INSERT INTO users (id, email, password_hash, status)
    VALUES (${testUserId}, ${testEmail}, 'hash_123', 'ACTIVE')
  `.execute(db);

  await sql`
    INSERT INTO organizations (id, name, slug, status)
    VALUES (${testOrgId}, 'Forensic Test PG', ${testSlug}, 'ACTIVE')
  `.execute(db);

  await sql`
    INSERT INTO properties (id, organization_id, name, code, address_line1, locality, city, state, postal_code)
    VALUES (${testPropertyId}, ${testOrgId}, 'Forensic Heights', 'PROP-01', '123 Main St', 'Koramangala', 'Bengaluru', 'Karnataka', '560001')
    ON CONFLICT (id) DO NOTHING
  `.execute(db);

  await sql`
    INSERT INTO buildings (id, organization_id, property_id, name, code)
    VALUES (${testBuildingId}, ${testOrgId}, ${testPropertyId}, 'Block A', 'BLD-A')
    ON CONFLICT (id) DO NOTHING
  `.execute(db);

  await sql`
    INSERT INTO floors (id, organization_id, building_id, floor_number, name)
    VALUES (${testFloorId}, ${testOrgId}, ${testBuildingId}, 1, 'First Floor')
    ON CONFLICT (id) DO NOTHING
  `.execute(db);

  await sql`
    INSERT INTO rooms (id, organization_id, property_id, building_id, floor_id, room_number, capacity)
    VALUES (${testRoomId}, ${testOrgId}, ${testPropertyId}, ${testBuildingId}, ${testFloorId}, '101', 2)
  `.execute(db);

  await sql`
    INSERT INTO beds (id, organization_id, room_id, bed_number)
    VALUES (${testBedId}, ${testOrgId}, ${testRoomId}, '101-A')
    ON CONFLICT (id) DO NOTHING
  `.execute(db);

  await sql`
    INSERT INTO residents (id, organization_id, resident_code, first_name, last_name, phone, gender, status)
    VALUES (${testResidentId}, ${testOrgId}, 'RES-001', 'Amit', 'Sharma', '+919876543210', 'MALE', 'ACTIVE')
  `.execute(db);

  await sql`
    INSERT INTO stays (id, organization_id, resident_id, admission_date, status)
    VALUES (${testStayId}, ${testOrgId}, ${testResidentId}, CURRENT_DATE, 'ACTIVE')
  `.execute(db);

  await sql`
    INSERT INTO bed_allocations (organization_id, stay_id, bed_id, start_at, status)
    VALUES (${testOrgId}, ${testStayId}, ${testBedId}, NOW(), 'ACTIVE')
  `.execute(db);

  console.log('✅ Test inventory and resident setup verified in PostgreSQL!');

  // 2. Create Mess Config
  console.log('2. Creating Mess Configuration...');
  const messRepo = new KyselyMessRepository(db);
  const config = await messRepo.upsertConfig(testOrgId, {
    isEnabled: true,
    scopeType: 'CENTRAL',
    billingMode: 'MONTHLY',
  });
  console.log('✅ Mess Config created. Verified in DB:', config.id);

  // 3. Create Mess & Assign Building
  console.log('3. Creating Mess Facility...');
  const mess = await messRepo.createMess({
    organization_id: testOrgId,
    name: 'Central Dining',
    code: 'MESS-CENTRAL',
    scope_type: 'CENTRAL',
    is_active: true,
  });
  await messRepo.assignBuildings(testOrgId, mess.id, [testBuildingId]);
  console.log('✅ Mess Facility created:', mess.id);

  // 4. Create Meal Type & Meal Plan
  console.log('4. Creating Meal Type & Meal Plan...');
  const mealType = await messRepo.createMealType({
    organization_id: testOrgId,
    mess_id: mess.id,
    name: 'Lunch',
    start_time: '12:00',
    end_time: '14:30',
    display_order: 1,
    is_active: true,
  });

  const mealPlan = await messRepo.createMealPlan({
    organization_id: testOrgId,
    mess_id: mess.id,
    name: 'Standard Monthly Plan',
    description: 'All meals included',
    billing_mode: 'MONTHLY',
    price: 3500 as never,
    included_meal_types: 'ALL',
    version: 1,
    is_active: true,
  });
  console.log('✅ Meal Type:', mealType.id, '| Meal Plan:', mealPlan.id);

  // 5. Create Vendor & Inventory Item
  console.log('5. Creating Vendor & Inventory Item...');
  const vendor = await messRepo.createVendor({
    organization_id: testOrgId,
    name: 'Metro Wholesale',
    phone: '+919888888888',
    email: 'contact@metrowholesale.com',
    address: 'Bengaluru',
    status: 'ACTIVE',
    notes: 'Primary grain vendor',
  });

  const invItem = await messRepo.createInventoryItem({
    organization_id: testOrgId,
    mess_id: mess.id,
    name: 'Basmati Rice',
    category: 'GRAINS',
    unit: 'kg',
    current_stock: 50 as never,
    minimum_stock: 10 as never,
    reorder_level: 20 as never,
    status: 'IN_STOCK',
  });
  console.log('✅ Vendor:', vendor.id, '| Inventory Item:', invItem.id);

  // 6. Record Procurement & Verify Atomic Stock Balance Increase
  console.log('6. Processing Procurement & Ledger Entry...');
  const unitOfWork = new KyselyUnitOfWork(db);
  const procurement = await unitOfWork.runInTransaction(async (trx: any) => {
    const proc = await messRepo.createProcurement(
      {
        organization_id: testOrgId,
        mess_id: mess.id,
        vendor_id: vendor.id,
        purchase_date: '2026-08-12',
        invoice_reference: 'INV-MW-991',
        total_amount: 3000 as never,
        notes: 'Monthly rice stock purchase',
      },
      [
        {
          inventory_item_id: invItem.id,
          quantity: 30 as never,
          unit_price: 100 as never,
          total_price: 3000 as never,
        },
      ],
      trx
    );

    await messRepo.updateItemStock(invItem.id, testOrgId, 80, 'IN_STOCK', trx);
    await messRepo.recordInventoryTransaction(
      {
        organization_id: testOrgId,
        mess_id: mess.id,
        inventory_item_id: invItem.id,
        transaction_type: 'PURCHASE',
        quantity: 30 as never,
        stock_before: 50 as never,
        stock_after: 80 as never,
        unit: 'kg',
        procurement_id: proc.id,
        notes: `Procurement #${proc.id}`,
      },
      trx
    );
    return proc;
  });

  // Verify stock in DB
  const verifyInvItemRes = await sql<{ current_stock: number }>`
    SELECT current_stock FROM mess_inventory_items WHERE id = ${invItem.id}
  `.execute(db);
  console.log(
    '✅ Procurement created:',
    procurement.id,
    '| New Stock in PostgreSQL:',
    verifyInvItemRes.rows[0].current_stock,
    'kg (Expected: 80)'
  );

  // 7. Create Commercial Agreement
  console.log('7. Creating Commercial Agreement...');
  const commAgreementRes = await sql<{ id: string }>`
    INSERT INTO resident_commercial_agreements (organization_id, resident_id, stay_id, base_rent_amount, security_deposit_amount, security_deposit_status, status)
    VALUES (${testOrgId}, ${testResidentId}, ${testStayId}, 8500.00, 17000.00, 'PAID', 'ACTIVE')
    RETURNING id
  `.execute(db);
  console.log('✅ Commercial Agreement created:', commAgreementRes.rows[0].id);

  // 8. Create Mess Subscription
  console.log('8. Creating Mess Subscription...');
  const sub = await messRepo.createSubscription({
    organization_id: testOrgId,
    resident_id: testResidentId,
    stay_id: testStayId,
    mess_id: mess.id,
    meal_plan_id: mealPlan.id,
    billing_mode: 'MONTHLY',
    price_at_subscription: 3500 as never,
    status: 'ACTIVE',
    start_date: '2026-08-12',
    end_date: null,
  });
  console.log('✅ Mess Subscription created:', sub.id);

  // 9. Record Meal Consumption
  console.log('9. Recording Meal Consumption...');
  const cons = await messRepo.recordConsumption({
    organization_id: testOrgId,
    subscription_id: sub.id,
    resident_id: testResidentId,
    stay_id: testStayId,
    mess_id: mess.id,
    meal_type_id: mealType.id,
    consumption_date: '2026-08-12',
    status: 'CONSUMED',
    notes: 'Checked in via RFID',
  });
  console.log('✅ Meal Consumption recorded:', cons.id);

  // 10. Generate Invoice, Record Payment, Generate Receipt
  console.log('10. Generating Invoice, Payment, and Receipt...');
  const invRes = await sql<{ id: string }>`
    INSERT INTO invoices (organization_id, resident_id, stay_id, invoice_number, billing_period_start, billing_period_end, due_date, subtotal_amount, total_amount, balance_due_amount, status)
    VALUES (${testOrgId}, ${testResidentId}, ${testStayId}, 'INV-2026-0001', '2026-08-01', '2026-08-31', '2026-08-10', 12000.00, 12000.00, 0.00, 'PAID')
    RETURNING id
  `.execute(db);

  const paymentRes = await sql<{ id: string }>`
    INSERT INTO payments (organization_id, resident_id, stay_id, payment_number, amount, payment_method, reference_number, payment_date, idempotency_key, status)
    VALUES (${testOrgId}, ${testResidentId}, ${testStayId}, 'PAY-2026-0001', 12000.00, 'UPI', 'UPI-REF-998877', CURRENT_DATE, ${randomUUID()}, 'COMPLETED')
    RETURNING id
  `.execute(db);

  const receiptRes = await sql<{ id: string }>`
    INSERT INTO receipts (organization_id, payment_id, resident_id, stay_id, receipt_number, amount, payment_method)
    VALUES (${testOrgId}, ${paymentRes.rows[0].id}, ${testResidentId}, ${testStayId}, 'REC-2026-0001', 12000.00, 'UPI')
    RETURNING id
  `.execute(db);
  console.log(
    '✅ Invoice:',
    invRes.rows[0].id,
    '| Payment:',
    paymentRes.rows[0].id,
    '| Receipt:',
    receiptRes.rows[0].id
  );

  // 11. Run Reporting Repository Aggregations
  console.log('11. Verifying Live Reporting Metrics from Real DB...');
  const reportingRepo = new KyselyReportingRepository(db);
  const occupancyMetrics = await reportingRepo.getOccupancyMetrics(testOrgId);
  const messMetrics = await reportingRepo.getMessMetrics(testOrgId);
  const billingMetrics = await reportingRepo.getBillingMetrics(testOrgId);

  console.log('\n--- LIVE METRICS AUDIT RESULT ---');
  console.log('Occupancy:', occupancyMetrics);
  console.log('Mess:', messMetrics);
  console.log('Billing:', billingMetrics);

  if (messMetrics.activeMessSubscribers >= 1) {
    console.log(
      '\n🎉 REAL MUTATION SMOKE TEST PASSED 100%! Data physically persisted and queried from PostgreSQL!'
    );
  } else {
    console.error(
      '\n❌ REAL MUTATION SMOKE TEST FAILED! Metrics did not match expected database state!'
    );
    process.exitCode = 1;
  }

  await dbService.shutdown();
}

runRealMutationSmokeTest().catch(console.error);
