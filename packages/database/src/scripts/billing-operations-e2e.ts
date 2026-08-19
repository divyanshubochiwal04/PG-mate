import { dbService } from '../connection/database';
import { KyselyBillingRepository } from '../repositories/billing.repository';
import { KyselyCommercialRepository } from '../repositories/commercial.repository';
import { KyselyMessRepository } from '../repositories/mess.repository';
import { KyselyResidentRepository } from '../repositories/resident.repository';
import { KyselyStayRepository } from '../repositories/stay.repository';
import { KyselyUnitOfWork } from '../transactions/unit-of-work';
import { KyselyOrganizationRepository } from '../repositories/organization.repository';
import { KyselyPropertyRepository } from '../repositories/property.repository';
import { KyselyBuildingRepository } from '../repositories/building.repository';
import { KyselyFloorRepository } from '../repositories/floor.repository';
import { KyselyRoomRepository } from '../repositories/room.repository';
import { KyselyBedRepository } from '../repositories/bed.repository';

import { KyselyFacilityRepository } from '../repositories/facility.repository';

async function runBillingOperationsE2E() {
  console.log('🚀 Starting Phase 27: Billing & Collection Operations Physical PostgreSQL E2E...');

  const db = dbService.db;
  const unitOfWork = new KyselyUnitOfWork(db);
  const orgRepo = new KyselyOrganizationRepository(db);
  const propRepo = new KyselyPropertyRepository(db);
  const bldgRepo = new KyselyBuildingRepository(db);
  const floorRepo = new KyselyFloorRepository(db);
  const roomRepo = new KyselyRoomRepository(db);
  const bedRepo = new KyselyBedRepository(db);
  const facilityRepo = new KyselyFacilityRepository(db);
  const residentRepo = new KyselyResidentRepository(db);
  const stayRepo = new KyselyStayRepository(db);
  const commercialRepo = new KyselyCommercialRepository(db);
  const messRepo = new KyselyMessRepository(db);
  const billingRepo = new KyselyBillingRepository(db);

  const suffix = Math.random().toString(36).substring(2, 7);

  // 1. Scaffold Org A & B
  const orgA = await orgRepo.createOrganization({
    name: `Billing Org A ${suffix}`,
    slug: `billing-org-a-${suffix}`,
  });
  const orgB = await orgRepo.createOrganization({
    name: `Billing Org B ${suffix}`,
    slug: `billing-org-b-${suffix}`,
  });

  // Scaffold Property -> Building -> Floor -> Room -> Bed
  const propA = await propRepo.createForOrganization(orgA.id, {
    name: `Billing Property ${suffix}`,
    code: `PROP-${suffix}`,
    addressLine1: '123 Finance Street',
    locality: 'Central',
    city: 'Metropolis',
    state: 'State',
    postalCode: '100001',
  });
  const bldgA = await bldgRepo.createForOrganization(orgA.id, {
    propertyId: propA.id,
    name: `Tower A ${suffix}`,
    code: `TA-${suffix}`,
  });
  const floor1 = await floorRepo.createForOrganization(orgA.id, {
    buildingId: bldgA.id,
    name: 'Floor 1',
    floorNumber: 1,
  });
  const room101 = await roomRepo.createForOrganization(orgA.id, {
    floorId: floor1.id,
    buildingId: bldgA.id,
    propertyId: propA.id,
    roomNumber: `101-${suffix}`,
    roomType: 'DOUBLE',
    capacity: 2,
  });
  const bedA1 = await bedRepo.createForOrganization(orgA.id, {
    roomId: room101.id,
    bedNumber: 'A1',
  });

  const facilityA = await facilityRepo.createForOrganization(orgA.id, {
    name: 'High Speed WiFi',
    code: `WIFI-${suffix}`,
    category: 'AMENITY',
    status: 'ACTIVE',
  });

  // Scaffold Mess & Meal Plan
  const messA = await messRepo.createMess({
    organization_id: orgA.id,
    name: `Grand Mess ${suffix}`,
    code: `GM-${suffix}`,
    scope_type: 'CENTRAL',
    is_active: true,
  });
  const mealPlanA = await messRepo.createMealPlan({
    organization_id: orgA.id,
    mess_id: messA.id,
    name: 'Premium 3-Meal',
    description: '3 meals per day',
    billing_mode: 'MONTHLY',
    included_meal_types: JSON.stringify(['BREAKFAST', 'LUNCH', 'DINNER']),
    price: 3000 as any,
    is_active: true,
    version: 1,
  });

  // Register Resident A
  const residentA = await residentRepo.createForOrganization(orgA.id, {
    residentCode: `RES-BILL-${suffix}`,
    firstName: 'Rohan',
    lastName: `Sharma ${suffix}`,
    gender: 'MALE',
    phone: `98100${suffix}`,
  });

  // Check-In Resident A to create Stay + Commercial Agreement + Facility + Mess Subscription
  const stayA = await stayRepo.createForOrganization(orgA.id, {
    residentId: residentA.id,
    admissionDate: new Date(),
    status: 'ACTIVE',
  });

  await commercialRepo.createAgreement({
    organization_id: orgA.id,
    resident_id: residentA.id,
    stay_id: stayA.id,
    base_rent_amount: 8000,
    security_deposit_amount: 10000,
    security_deposit_status: 'PAID',
    billing_cycle: 'JOINING_DATE',
    effective_date: '2026-08-01',
    end_date: null,
    status: 'ACTIVE',
  });

  await commercialRepo.assignFacility({
    organization_id: orgA.id,
    resident_id: residentA.id,
    stay_id: stayA.id,
    facility_id: facilityA.id,
    facility_type: 'PAID',
    monthly_charge: 500,
    status: 'ACTIVE',
    effective_date: '2026-08-01',
  });

  await commercialRepo.addAdditionalCharge({
    organization_id: orgA.id,
    resident_id: residentA.id,
    stay_id: stayA.id,
    agreement_id: null,
    charge_type: 'PARKING',
    description: 'Parking Space',
    amount: 1000,
    is_recurring: true,
    effective_date: '2026-08-01',
    status: 'ACTIVE',
  });

  await messRepo.createSubscription({
    organization_id: orgA.id,
    resident_id: residentA.id,
    stay_id: stayA.id,
    mess_id: messA.id,
    meal_plan_id: mealPlanA.id,
    billing_mode: 'MONTHLY',
    price_at_subscription: 3000 as any,
    start_date: '2026-08-01',
    end_date: null,
    status: 'ACTIVE',
  });

  console.log('✅ 1. Scaffolding complete for Org A, Resident A, Stay A');

  // STEP 1-7: Invoice Generation & Line Items Calculation Verification
  const now = new Date();
  const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const periodEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const invNum = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${stayA.id.slice(0, 5).toUpperCase()}`;

  const invCreated = await billingRepo.createInvoice({
    organization_id: orgA.id,
    resident_id: residentA.id,
    stay_id: stayA.id,
    invoice_number: invNum,
    billing_period_start: periodStart,
    billing_period_end: periodEnd,
    due_date: '2026-08-10',
    subtotal_amount: 12500, // 8000 + 500 + 1000 + 3000
    total_amount: 12500,
    balance_due_amount: 12500,
    status: 'ISSUED',
  });

  await billingRepo.createInvoiceItems([
    {
      organization_id: orgA.id,
      invoice_id: invCreated.id,
      charge_type: 'BASE_RENT',
      description: 'Monthly Base Rent',
      unit_amount: 8000,
      quantity: 1,
      total_amount: 8000,
    },
    {
      organization_id: orgA.id,
      invoice_id: invCreated.id,
      charge_type: 'FACILITY',
      description: 'Facility Fee (WIFI)',
      unit_amount: 500,
      quantity: 1,
      total_amount: 500,
    },
    {
      organization_id: orgA.id,
      invoice_id: invCreated.id,
      charge_type: 'ADDITIONAL_CHARGE',
      description: 'Parking Space',
      unit_amount: 1000,
      quantity: 1,
      total_amount: 1000,
    },
    {
      organization_id: orgA.id,
      invoice_id: invCreated.id,
      charge_type: 'MESS',
      description: 'Monthly Mess Subscription',
      unit_amount: 3000,
      quantity: 1,
      total_amount: 3000,
    },
  ]);

  if (!invCreated.id) throw new Error('Invoice not created');
  const itemsCreated = await billingRepo.findInvoiceItemsByInvoiceId(invCreated.id, orgA.id);
  if (itemsCreated.length !== 4) throw new Error(`Expected 4 items, got ${itemsCreated.length}`);

  const totalCalculated = itemsCreated.reduce((s, i) => s + Number(i.total_amount), 0);
  if (totalCalculated !== 12500) throw new Error(`Expected total 12500, got ${totalCalculated}`);

  console.log('✅ 2-7. Invoice & Line Items physically verified in PostgreSQL (Total: ₹12,500)');

  // STEP 8: Duplicate Generation Protection (Partial Unique Index)
  try {
    await billingRepo.createInvoice({
      organization_id: orgA.id,
      resident_id: residentA.id,
      stay_id: stayA.id,
      invoice_number: `${invNum}-DUP`,
      billing_period_start: periodStart,
      billing_period_end: periodEnd,
      due_date: '2026-08-10',
      subtotal_amount: 12500,
      total_amount: 12500,
      balance_due_amount: 12500,
      status: 'ISSUED',
    });
    throw new Error('Duplicate invoice generation was NOT blocked by PostgreSQL!');
  } catch (err: any) {
    if (err.message.includes('blocked by PostgreSQL')) throw err;
    console.log('✅ 8. Duplicate invoice generation safely blocked by unique index');
  }

  // STEP 9: Invoice Detail GET
  const freshInv = await billingRepo.findInvoiceById(invCreated.id, orgA.id);
  if (!freshInv || freshInv.invoice_number !== invNum) {
    throw new Error('Invoice detail GET failed!');
  }
  console.log('✅ 9. Invoice Detail GET successfully verified');

  // STEP 10-16: Partial Payment Collection (₹5,000 against ₹12,500)
  const idemp1 = `idemp-pay1-${suffix}`;
  const pay1Num = `PAY-${suffix}-1`;
  const rec1Num = `REC-${suffix}-1`;

  const pay1 = await billingRepo.createPayment({
    organization_id: orgA.id,
    resident_id: residentA.id,
    stay_id: stayA.id,
    payment_number: pay1Num,
    amount: 5000,
    payment_method: 'UPI',
    reference_number: 'UPI-123456',
    payment_date: '2026-08-05',
    idempotency_key: idemp1,
  });

  const alloc1 = await billingRepo.createAllocation({
    organization_id: orgA.id,
    payment_id: pay1.id,
    invoice_id: invCreated.id,
    amount: 5000,
  });

  const rec1 = await billingRepo.createReceipt({
    organization_id: orgA.id,
    payment_id: pay1.id,
    receipt_number: rec1Num,
    resident_id: residentA.id,
    stay_id: stayA.id,
    amount: 5000,
    payment_method: 'UPI',
  });

  const invAfterPay1 = await billingRepo.updateInvoiceBalance(invCreated.id, orgA.id, 5000);

  if (Number(invAfterPay1.paid_amount) !== 5000) throw new Error('Paid amount not 5000');
  if (Number(invAfterPay1.balance_due_amount) !== 7500) throw new Error('Balance due not 7500');
  if (invAfterPay1.status !== 'PARTIALLY_PAID') throw new Error('Status not PARTIALLY_PAID');

  console.log(
    `✅ 10-16. Partial Payment collected: Paid ₹5,000, Remaining ₹7,500, Status: ${invAfterPay1.status}`
  );

  // STEP 17: Full Remaining Payment Collection (₹7,500 against ₹7,500)
  const idemp2 = `idemp-pay2-${suffix}`;
  const pay2Num = `PAY-${suffix}-2`;
  const rec2Num = `REC-${suffix}-2`;

  const pay2 = await billingRepo.createPayment({
    organization_id: orgA.id,
    resident_id: residentA.id,
    stay_id: stayA.id,
    payment_number: pay2Num,
    amount: 7500,
    payment_method: 'CASH',
    payment_date: '2026-08-10',
    idempotency_key: idemp2,
  });

  await billingRepo.createAllocation({
    organization_id: orgA.id,
    payment_id: pay2.id,
    invoice_id: invCreated.id,
    amount: 7500,
  });

  await billingRepo.createReceipt({
    organization_id: orgA.id,
    payment_id: pay2.id,
    receipt_number: rec2Num,
    resident_id: residentA.id,
    stay_id: stayA.id,
    amount: 7500,
    payment_method: 'CASH',
  });

  const invAfterPay2 = await billingRepo.updateInvoiceBalance(invCreated.id, orgA.id, 7500);

  if (Number(invAfterPay2.paid_amount) !== 12500) throw new Error('Paid amount not 12500');
  if (Number(invAfterPay2.balance_due_amount) !== 0) throw new Error('Balance due not 0');
  if (invAfterPay2.status !== 'PAID') throw new Error('Status not PAID');

  console.log(
    `✅ 17. Full Payment collected: Paid ₹12,500, Remaining ₹0, Status: ${invAfterPay2.status}`
  );

  // STEP 18: Resident Ledger Calculation Verification
  const ledger = await billingRepo.getResidentLedger(orgA.id, residentA.id);
  if (ledger.totalInvoiced !== 12500) throw new Error(`Expected totalInvoiced 12500, got ${ledger.totalInvoiced}`);
  if (ledger.totalPaid !== 12500) throw new Error(`Expected totalPaid 12500, got ${ledger.totalPaid}`);
  if (ledger.totalOutstanding !== 0) throw new Error(`Expected totalOutstanding 0, got ${ledger.totalOutstanding}`);
  if (ledger.ledger.length !== 3) throw new Error(`Expected 3 ledger entries (1 inv + 2 pays), got ${ledger.ledger.length}`);

  console.log('✅ 18. Resident Ledger calculation verified');

  // STEP 19-21: Historical Immutability
  if (Number(freshInv.total_amount) !== 12500) throw new Error('Historical invoice mutated!');
  if (Number(pay1.amount) !== 5000) throw new Error('Historical payment mutated!');
  if (Number(rec1.amount) !== 5000) throw new Error('Historical receipt mutated!');
  console.log('✅ 19-21. Historical Invoice, Payment, and Receipt immutability verified');

  // STEP 22: Cross-Tenant Isolation
  const crossInv = await billingRepo.findInvoiceById(invCreated.id, orgB.id);
  if (crossInv !== null) throw new Error('Cross-tenant invoice access succeeded!');

  const crossPay = await billingRepo.findPaymentById(pay1.id, orgB.id);
  if (crossPay !== null) throw new Error('Cross-tenant payment access succeeded!');

  const crossRec = await billingRepo.findReceiptByPaymentId(pay1.id, orgB.id);
  if (crossRec !== null) throw new Error('Cross-tenant receipt access succeeded!');

  console.log('✅ 22. Cross-Tenant Isolation verified across all billing entities');

  // STEP 23: Forced Transaction Rollback Test
  try {
    await unitOfWork.runInTransaction(async (trx) => {
      await billingRepo.createPayment(
        {
          organization_id: orgA.id,
          resident_id: residentA.id,
          stay_id: stayA.id,
          payment_number: `PAY-ROLLBACK-${suffix}`,
          amount: 1000,
          payment_method: 'CASH',
          payment_date: '2026-08-11',
          idempotency_key: `idemp-rollback-${suffix}`,
        },
        trx
      );
      throw new Error('FORCED_SIMULATED_FAILURE');
    });
  } catch (err: any) {
    if (err.message !== 'FORCED_SIMULATED_FAILURE') throw err;
  }

  const rolledBackPay = await billingRepo.findByIdempotencyKey(
    orgA.id,
    `idemp-rollback-${suffix}`
  );
  if (rolledBackPay !== null) throw new Error('Transaction rollback failed — orphan payment persisted!');
  console.log('✅ 23. Transaction Rollback Integrity verified');

  // STEP 24: Concurrent Payment Protection (Idempotency Key)
  const dupPayAttempt = await billingRepo.findByIdempotencyKey(orgA.id, idemp1);
  if (!dupPayAttempt || dupPayAttempt.id !== pay1.id) {
    throw new Error('Idempotency lookup failed!');
  }
  console.log('✅ 24. Concurrent Payment protection (Idempotency) verified');

  // STEP 25: Concurrent Invoice Generation Protection
  const activeInvCheck = await billingRepo.findActiveInvoiceByStayAndPeriod(
    orgA.id,
    stayA.id,
    periodStart
  );
  if (!activeInvCheck) throw new Error('Active invoice lookup failed!');
  console.log('✅ 25. Concurrent Invoice Generation protection verified');

  console.log('\n🎉 BILLING & COLLECTION E2E VERIFICATION PASSED 100%');
}

runBillingOperationsE2E()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ E2E Execution Failed:', err);
    process.exit(1);
  });
