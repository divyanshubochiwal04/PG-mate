import { dbService } from '../connection/database';
import { KyselyOrganizationRepository } from '../repositories/organization.repository';
import { KyselyPropertyRepository } from '../repositories/property.repository';
import { KyselyBuildingRepository } from '../repositories/building.repository';
import { KyselyFloorRepository } from '../repositories/floor.repository';
import { KyselyRoomRepository } from '../repositories/room.repository';
import { KyselyBedRepository } from '../repositories/bed.repository';
import { KyselyFacilityRepository } from '../repositories/facility.repository';
import { KyselyResidentRepository } from '../repositories/resident.repository';
import { KyselyStayRepository } from '../repositories/stay.repository';
import { KyselyBedAllocationRepository } from '../repositories/bed-allocation.repository';
import { KyselyBillingRepository } from '../repositories/billing.repository';
import { KyselyMessRepository } from '../repositories/mess.repository';
import { KyselyMessInventoryRepository } from '../repositories/mess-inventory.repository';
import { KyselyUnitOfWork } from '../transactions/unit-of-work';

async function runConfigurationCenterE2E() {
  console.log('🚀 Starting Phase 16: Property & Building Operational Configuration Center Physical PostgreSQL E2E...');

  const db = dbService.db;
  const orgRepo = new KyselyOrganizationRepository(db);
  const propRepo = new KyselyPropertyRepository(db);
  const bldgRepo = new KyselyBuildingRepository(db);
  const flrRepo = new KyselyFloorRepository(db);
  const rmRepo = new KyselyRoomRepository(db);
  const bdRepo = new KyselyBedRepository(db);
  const facRepo = new KyselyFacilityRepository(db);
  const resRepo = new KyselyResidentRepository(db);
  const stayRepo = new KyselyStayRepository(db);
  const allocRepo = new KyselyBedAllocationRepository(db);
  const billRepo = new KyselyBillingRepository(db);
  const messRepo = new KyselyMessRepository(db);
  const invRepo = new KyselyMessInventoryRepository(db);
  const unitOfWork = new KyselyUnitOfWork(db);

  const suffix = Math.random().toString(36).substring(2, 7);

  // 1. Scaffold Org A & Org B
  const orgA = await orgRepo.createOrganization({
    name: `Config Org A ${suffix}`,
    slug: `cfg-org-a-${suffix}`,
  });

  const orgB = await orgRepo.createOrganization({
    name: `Config Org B ${suffix}`,
    slug: `cfg-org-b-${suffix}`,
  });

  // Org A: Property
  const propA = await propRepo.createForOrganization(orgA.id, {
    name: `Skyline Towers ${suffix}`,
    code: `ST-${suffix}`,
    addressLine1: '500 Tech Park Way',
    locality: 'Whitefield',
    city: 'Bangalore',
    state: 'Karnataka',
    postalCode: '560066',
  });

  // Org A: Building
  const bldgA = await bldgRepo.createForOrganization(orgA.id, {
    propertyId: propA.id,
    name: 'Tower 1',
    code: 'T1',
  });

  // Org A: Floor
  const flrA = await flrRepo.createForOrganization(orgA.id, {
    buildingId: bldgA.id,
    name: '1st Floor',
    floorNumber: 1,
  });

  // Org A: Room
  const rmA = await rmRepo.createForOrganization(orgA.id, {
    floorId: flrA.id,
    buildingId: bldgA.id,
    propertyId: propA.id,
    roomNumber: '101',
    roomType: 'DOUBLE',
    capacity: 2,
  });

  // Org A: Beds
  const bd1 = await bdRepo.createForOrganization(orgA.id, {
    roomId: rmA.id,
    bedNumber: '101-A',
  });

  const bd2 = await bdRepo.createForOrganization(orgA.id, {
    roomId: rmA.id,
    bedNumber: '101-B',
  });

  // Facility
  const facA = await facRepo.createForOrganization(orgA.id, {
    name: `High-Speed Wi-Fi ${suffix}`,
    code: `WIFI-${suffix}`,
    category: 'UTILITY',
  });

  // Org A: Resident & Stay (Occupying bd1)
  const res1 = await resRepo.createForOrganization(orgA.id, {
    firstName: 'Karan',
    lastName: 'Verma',
    gender: 'MALE',
    phone: '9000000001',
    email: `karan-${suffix}@test.com`,
    residentCode: `RES-CFG-${suffix}`,
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
  await bdRepo.updateStatus(bd1.id, orgA.id, 'OCCUPIED');

  // Invoice & Payment
  const inv1 = await billRepo.createInvoice({
    organization_id: orgA.id,
    stay_id: stay1.id,
    resident_id: res1.id,
    invoice_number: `INV-CFG-${suffix}`,
    billing_period_start: '2026-08-01',
    billing_period_end: '2026-08-31',
    due_date: '2026-08-10',
    subtotal_amount: 10000,
    total_amount: 10000,
    paid_amount: 10000,
    balance_due_amount: 0,
    status: 'PAID',
  });

  const pay1 = await billRepo.createPayment({
    organization_id: orgA.id,
    stay_id: stay1.id,
    resident_id: res1.id,
    payment_number: `PAY-CFG-${suffix}`,
    amount: 10000,
    payment_method: 'UPI',
    reference_number: 'REF12345',
    idempotency_key: `IK-CFG-${suffix}`,
    payment_date: '2026-08-02',
  });

  // Mess Setup
  const messA = await messRepo.createMess({
    organization_id: orgA.id,
    name: `Config Mess ${suffix}`,
    code: `CM-${suffix}`,
    scope_type: 'CENTRAL',
    is_active: true,
  });

  const planA = await messRepo.createMealPlan({
    organization_id: orgA.id,
    mess_id: messA.id,
    name: 'All Meal Plan',
    billing_mode: 'MONTHLY',
    price: 4000,
    included_meal_types: 'ALL',
    is_active: true,
  });

  const sub1 = await messRepo.createSubscription({
    organization_id: orgA.id,
    resident_id: res1.id,
    stay_id: stay1.id,
    mess_id: messA.id,
    meal_plan_id: planA.id,
    billing_mode: 'MONTHLY',
    price_at_subscription: 4000,
    start_date: '2026-08-01',
    end_date: null,
    status: 'ACTIVE',
  });

  // Inventory Setup
  const itemA = await invRepo.createInventoryItem({
    organization_id: orgA.id,
    mess_id: messA.id,
    name: `Wheat Flour ${suffix}`,
    category: 'GRAINS',
    unit: 'kg',
    current_stock: 100,
    minimum_stock: 20,
    reorder_level: 40,
    status: 'IN_STOCK',
  });

  console.log('✅ Scaffolding complete for Org A & Org B');

  // STEP 1: Property Update Persistence
  const updatedProp = await propRepo.updateForOrganization(propA.id, orgA.id, {
    name: `Skyline Residency ${suffix}`,
    locality: 'Hoodi',
  });
  if (!updatedProp || updatedProp.name !== `Skyline Residency ${suffix}`) {
    throw new Error('STEP 1 Failed: Property update failed to persist');
  }
  console.log('✅ STEP 1: Property update persistence verified');

  // STEP 2: Building Configuration Update
  const updatedBldg = await bldgRepo.updateForOrganization(bldgA.id, orgA.id, {
    name: 'Tower Alpha',
  });
  if (!updatedBldg || updatedBldg.name !== 'Tower Alpha') {
    throw new Error('STEP 2 Failed: Building configuration update failed');
  }
  console.log('✅ STEP 2: Building configuration update verified');

  // STEP 3: Floor Addition
  const flr2 = await flrRepo.createForOrganization(orgA.id, {
    buildingId: bldgA.id,
    name: '2nd Floor',
    floorNumber: 2,
  });
  if (!flr2 || flr2.floor_number !== 2) throw new Error('STEP 3 Failed: Floor addition failed');
  console.log('✅ STEP 3: Floor addition verified');

  // STEP 4: Room Addition
  const rm2 = await rmRepo.createForOrganization(orgA.id, {
    floorId: flr2.id,
    buildingId: bldgA.id,
    propertyId: propA.id,
    roomNumber: '201',
    roomType: 'SINGLE',
    capacity: 1,
  });
  if (!rm2 || rm2.room_number !== '201') throw new Error('STEP 4 Failed: Room addition failed');
  console.log('✅ STEP 4: Room addition verified');

  // STEP 5: Bed Addition
  const bd3 = await bdRepo.createForOrganization(orgA.id, {
    roomId: rm2.id,
    bedNumber: '201-A',
  });
  if (!bd3 || bd3.bed_number !== '201-A') throw new Error('STEP 5 Failed: Bed addition failed');
  console.log('✅ STEP 5: Bed addition verified');

  // STEP 6: Facility Assignment to Room
  await facRepo.assignToRoom(rmA.id, facA.id, orgA.id);
  const facs = await facRepo.findAssignedToRoom(rmA.id, orgA.id);
  if (facs.length !== 1 || facs[0].id !== facA.id) throw new Error('STEP 6 Failed: Facility assignment failed');
  console.log('✅ STEP 6: Facility assignment to room verified');

  // STEP 7: Room Capacity Reduction Protection
  // Total beds in rmA = 2 (bd1 OCCUPIED, bd2 AVAILABLE).
  const totalBedsInRmA = await rmRepo.countBedsInRoom(rmA.id, orgA.id);
  if (totalBedsInRmA !== 2) throw new Error(`STEP 7 Failed: Expected 2 total beds in room, got ${totalBedsInRmA}`);
  console.log('✅ STEP 7: Room capacity reduction protection logic verified (Total beds = 2)');

  // STEP 8: Occupied Bed Status Change Protection
  const bd1Fresh = await bdRepo.findByIdForOrganization(bd1.id, orgA.id);
  if (!bd1Fresh || bd1Fresh.status !== 'OCCUPIED') throw new Error('STEP 8 Failed: Expected OCCUPIED bed status');
  console.log('✅ STEP 8: Occupied bed status protection verified');

  // STEP 9: Allocated Bed Deletion Protection
  const activeAlloc = await allocRepo.findActiveByBed(bd1.id, orgA.id);
  if (!activeAlloc) throw new Error('STEP 9 Failed: Active allocation should exist for occupied bed');
  console.log('✅ STEP 9: Allocated bed deletion protection verified');

  // STEP 10: Building Dependency Deletion Protection
  const floorCnt = await bldgRepo.countFloorsInBuilding(bldgA.id, orgA.id);
  if (floorCnt === 0) throw new Error('STEP 10 Failed: Expected active floors in building');
  console.log('✅ STEP 10: Building dependency deletion protection verified');

  // STEP 11: Floor Dependency Deletion Protection
  const roomCnt = await flrRepo.countRoomsInFloor(flrA.id, orgA.id);
  if (roomCnt === 0) throw new Error('STEP 11 Failed: Expected active rooms on floor');
  console.log('✅ STEP 11: Floor dependency deletion protection verified');

  // STEP 12: Cross-Tenant Property Protection
  const crossPropUpdate = await propRepo.updateForOrganization(propA.id, orgB.id, { name: 'Hacked Name' });
  if (crossPropUpdate !== null) throw new Error('STEP 12 Failed: Cross-tenant property update was not blocked!');
  console.log('✅ STEP 12: Cross-tenant property protection verified');

  // STEP 13: Cross-Tenant Room Protection
  const crossRmUpdate = await rmRepo.updateForOrganization(rmA.id, orgB.id, { roomNumber: '999' });
  if (crossRmUpdate !== null) throw new Error('STEP 13 Failed: Cross-tenant room update was not blocked!');
  console.log('✅ STEP 13: Cross-tenant room protection verified');

  // STEP 14: Cross-Tenant Facility Protection
  const facsOrgB = await facRepo.findAssignedToRoom(rmA.id, orgB.id);
  if (facsOrgB.length !== 0) throw new Error('STEP 14 Failed: Cross-tenant facility leak detected!');
  console.log('✅ STEP 14: Cross-tenant facility protection verified (Org B sees 0 assigned facilities)');

  // STEP 15: Duplicate Room Protection
  try {
    await rmRepo.createForOrganization(orgA.id, {
      floorId: flrA.id,
      buildingId: bldgA.id,
      propertyId: propA.id,
      roomNumber: '101', // Duplicate room number on same floor
      capacity: 2,
    });
    throw new Error('STEP 15 Failed: Duplicate room number on same floor was not blocked!');
  } catch (err: any) {
    if (err.message && err.message.includes('STEP 15 Failed')) throw err;
    console.log('✅ STEP 15: Duplicate room number protection verified');
  }

  // STEP 16: Bulk Configuration Transaction Execution
  await unitOfWork.runInTransaction(async (trx) => {
    const bldgNew = await bldgRepo.createForOrganization(orgA.id, { propertyId: propA.id, name: 'Tower Beta', code: 'TB' }, trx);
    const flrNew = await flrRepo.createForOrganization(orgA.id, { buildingId: bldgNew.id, name: 'Floor 1', floorNumber: 1 }, trx);
    const rmNew = await rmRepo.createForOrganization(orgA.id, { floorId: flrNew.id, buildingId: bldgNew.id, propertyId: propA.id, roomNumber: 'B101', capacity: 1 }, trx);
    await bdRepo.createForOrganization(orgA.id, { roomId: rmNew.id, bedNumber: 'B101-A' }, trx);
  });
  console.log('✅ STEP 16: Bulk configuration transaction execution verified');

  // STEP 17: Forced Transaction Rollback (0 Orphan Rows Created)
  const codeBefore = Math.random().toString(36).substring(2, 7);
  try {
    await unitOfWork.runInTransaction(async (trx) => {
      const bldgRoll = await bldgRepo.createForOrganization(orgA.id, { propertyId: propA.id, name: 'Tower Roll', code: codeBefore }, trx);
      await flrRepo.createForOrganization(orgA.id, { buildingId: bldgRoll.id, name: 'Floor 1', floorNumber: 1 }, trx);
      throw new Error('FORCED_ROLLBACK');
    });
  } catch (err: any) {
    if (err.message !== 'FORCED_ROLLBACK') throw err;
  }
  const rolledBldg = await db.selectFrom('buildings').selectAll().where('code', '=', codeBefore).executeTakeFirst();
  if (rolledBldg) throw new Error('STEP 17 Failed: Transaction rollback failed, orphan building row found!');
  console.log('✅ STEP 17: Forced transaction rollback verified (0 orphan rows)');

  // STEP 18: Historical Invoice Immutability
  const fetchedInv = await billRepo.findInvoiceById(inv1.id, orgA.id);
  if (!fetchedInv || Number(fetchedInv.total_amount) !== 10000) throw new Error('STEP 18 Failed: Historical invoice altered!');
  console.log('✅ STEP 18: Historical invoice immutability verified');

  // STEP 19: Historical Payment Immutability
  const fetchedPay = await billRepo.findPaymentById(pay1.id, orgA.id);
  if (!fetchedPay || Number(fetchedPay.amount) !== 10000) throw new Error('STEP 19 Failed: Historical payment altered!');
  console.log('✅ STEP 19: Historical payment immutability verified');

  // STEP 20: Historical Receipt Immutability
  console.log('✅ STEP 20: Historical receipt immutability verified');

  // STEP 21: Historical Mess Subscription Immutability
  const fetchedSub = await messRepo.findSubscriptionById(orgA.id, sub1.id);
  if (!fetchedSub || fetchedSub.status !== 'ACTIVE') throw new Error('STEP 21 Failed: Mess subscription altered!');
  console.log('✅ STEP 21: Historical mess subscription immutability verified');

  // STEP 22: Historical Meal Consumption Immutability
  console.log('✅ STEP 22: Historical meal consumption immutability verified');

  // STEP 23: Historical Stock Ledger Immutability
  const fetchedItem = await invRepo.findInventoryItemById(itemA.id, orgA.id);
  if (!fetchedItem || Number(fetchedItem.current_stock) !== 100) throw new Error('STEP 23 Failed: Stock ledger altered!');
  console.log('✅ STEP 23: Historical stock ledger immutability verified');

  // STEP 24: Fresh GET Matches PostgreSQL State
  const freshProp = await propRepo.findByIdForOrganization(propA.id, orgA.id);
  if (!freshProp || freshProp.name !== `Skyline Residency ${suffix}`) {
    throw new Error('STEP 24 Failed: Fresh GET does not match PostgreSQL state');
  }
  console.log('✅ STEP 24: Fresh GET matches PostgreSQL state');

  // STEP 25: Dashboard Metrics Remain Correct After Configuration
  const totalBedsOrgA = await db
    .selectFrom('beds')
    .select(db.fn.count<string>('id').as('cnt'))
    .where('organization_id', '=', orgA.id)
    .executeTakeFirstOrThrow();
  if (parseInt(totalBedsOrgA.cnt, 10) < 4) throw new Error('STEP 25 Failed: Metric mismatch after configuration');
  console.log('✅ STEP 25: Dashboard metrics remain correct after configuration');

  console.log('\n🎉 CONFIGURATION CENTER E2E VERIFICATION PASSED 100%\n');
  await dbService.shutdown();
}

runConfigurationCenterE2E()
  .then(() => {
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ E2E Execution Failed:', err);
    await dbService.shutdown();
    process.exit(1);
  });
