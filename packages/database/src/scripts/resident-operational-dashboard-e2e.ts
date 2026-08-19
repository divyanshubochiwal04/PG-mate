import { dbService } from '../connection/database';
import { KyselyOrganizationRepository } from '../repositories/organization.repository';
import { KyselyPropertyRepository } from '../repositories/property.repository';
import { KyselyBuildingRepository } from '../repositories/building.repository';
import { KyselyFloorRepository } from '../repositories/floor.repository';
import { KyselyRoomRepository } from '../repositories/room.repository';
import { KyselyBedRepository } from '../repositories/bed.repository';
import { KyselyResidentRepository } from '../repositories/resident.repository';
import { KyselyStayRepository } from '../repositories/stay.repository';
import { KyselyBedAllocationRepository } from '../repositories/bed-allocation.repository';
import { KyselyCommercialRepository } from '../repositories/commercial.repository';
import { KyselyMessRepository } from '../repositories/mess.repository';
import { MigrationService } from '../migrations/migrator';
import { sql } from 'kysely';

export async function runResidentOperationalDashboardE2EVerification(): Promise<void> {
  console.log('🚀 Starting Physical PostgreSQL Resident Operations Dashboard E2E Verification...');

  const db = dbService.db;
  const migrator = new MigrationService(db);
  await migrator.migrateToLatest();

  const orgRepo = new KyselyOrganizationRepository(db);
  const propertyRepo = new KyselyPropertyRepository(db);
  const buildingRepo = new KyselyBuildingRepository(db);
  const floorRepo = new KyselyFloorRepository(db);
  const roomRepo = new KyselyRoomRepository(db);
  const bedRepo = new KyselyBedRepository(db);
  const residentRepo = new KyselyResidentRepository(db);
  const stayRepo = new KyselyStayRepository(db);
  const allocationRepo = new KyselyBedAllocationRepository(db);
  const commercialRepo = new KyselyCommercialRepository(db);
  const messRepo = new KyselyMessRepository(db);

  const suffix = Math.floor(Math.random() * 899999 + 100000).toString();

  const results = {
    scaffoldComplete: false,
    operationalListExecuted: false,
    searchByNameVerified: false,
    searchByPhoneVerified: false,
    searchByCodeVerified: false,
    stayStatusActiveVerified: false,
    stayStatusCheckedOutVerified: false,
    stayStatusNoStayVerified: false,
    propertyFilterVerified: false,
    buildingFilterVerified: false,
    floorFilterVerified: false,
    messFilterActiveVerified: false,
    messFilterNoneVerified: false,
    billingFilterDueVerified: false,
    billingFilterPaidVerified: false,
    summaryCountsVerified: false,
    outstandingBalanceVerified: false,
    paginationVerified: false,
    crossTenantIsolationVerified: false,
    deterministicOrderingVerified: false,
    noDuplicateRowsVerified: false,
  };

  try {
    // 1. Scaffold Org A & Org B
    const orgA = await orgRepo.createOrganization({ name: `Org A OpDash ${suffix}`, slug: `org-a-opdash-${suffix}` });
    const orgB = await orgRepo.createOrganization({ name: `Org B OpDash ${suffix}`, slug: `org-b-opdash-${suffix}` });

    // 2. Properties, Buildings, Floors, Rooms, Beds for Org A
    const propA = await propertyRepo.createForOrganization(orgA.id, { name: 'Residency Heights', code: `PROP-A-${suffix}`, addressLine1: '123 Main St', locality: 'Central', city: 'Jaipur', state: 'Rajasthan', postalCode: '302001' });
    const bldgA = await buildingRepo.createForOrganization(orgA.id, { propertyId: propA.id, name: 'Block A', code: `BLDG-A-${suffix}` });
    const floorA1 = await floorRepo.createForOrganization(orgA.id, { buildingId: bldgA.id, name: 'Floor 1', floorNumber: 1 });
    const roomA101 = await roomRepo.createForOrganization(orgA.id, { floorId: floorA1.id, buildingId: bldgA.id, propertyId: propA.id, roomNumber: '101', roomType: 'DOUBLE', capacity: 2 });
    const bedA1 = await bedRepo.createForOrganization(orgA.id, { roomId: roomA101.id, bedNumber: '101A' });
    const bedA2 = await bedRepo.createForOrganization(orgA.id, { roomId: roomA101.id, bedNumber: '101B' });

    // 3. Org A Resident 1 — ACTIVE Stay, Mess Sub, Unpaid Invoice Dues
    const res1 = await residentRepo.createForOrganization(orgA.id, { residentCode: `RES-OP1-${suffix}`, firstName: 'Aarav', lastName: 'Kumar', gender: 'MALE', phone: `98100${suffix}`, email: `aarav.${suffix}@example.com` });
    const stay1 = await stayRepo.createForOrganization(orgA.id, { residentId: res1.id, admissionDate: new Date('2026-08-01'), status: 'ACTIVE' });
    await allocationRepo.createForOrganization(orgA.id, { stayId: stay1.id, bedId: bedA1.id, startAt: new Date('2026-08-01') });
    await bedRepo.updateStatus(bedA1.id, orgA.id, 'OCCUPIED');

    const messA = await messRepo.createMess({ organization_id: orgA.id, name: 'Central Mess A', code: `MESS-A-${suffix}`, scope_type: 'CENTRAL', is_active: true });
    const planA = await messRepo.createMealPlan({ organization_id: orgA.id, mess_id: messA.id, name: 'Gold Monthly', description: null, billing_mode: 'MONTHLY', price: 5000, included_meal_types: 'ALL', is_active: true });
    await messRepo.createSubscription({ organization_id: orgA.id, resident_id: res1.id, stay_id: stay1.id, mess_id: messA.id, meal_plan_id: planA.id, billing_mode: 'MONTHLY', price_at_subscription: 5000, start_date: '2026-08-01', end_date: null, status: 'ACTIVE' });

    const inv1Id = crypto.randomUUID();
    await db.insertInto('invoices').values({
      id: inv1Id,
      organization_id: orgA.id,
      resident_id: res1.id,
      stay_id: stay1.id,
      invoice_number: `INV-OP1-${suffix}`,
      billing_period_start: '2026-08-01',
      billing_period_end: '2026-08-31',
      subtotal_amount: 8000,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: 8000,
      paid_amount: 3000,
      balance_due_amount: 5000,
      status: 'ISSUED',
      due_date: '2026-08-05',
    }).execute();

    // 4. Org A Resident 2 — CHECKED_OUT Resident (Stay COMPLETED)
    const res2 = await residentRepo.createForOrganization(orgA.id, { residentCode: `RES-OP2-${suffix}`, firstName: 'Bhavna', lastName: 'Singh', gender: 'FEMALE', phone: `98200${suffix}`, email: `bhavna.${suffix}@example.com` });
    const stay2 = await stayRepo.createForOrganization(orgA.id, { residentId: res2.id, admissionDate: new Date('2026-07-01'), status: 'ACTIVE' });
    await stayRepo.completeStay(stay2.id, orgA.id, new Date('2026-08-10'));

    // 5. Org A Resident 3 — NO_STAY Resident (No stays registered)
    const res3 = await residentRepo.createForOrganization(orgA.id, { residentCode: `RES-OP3-${suffix}`, firstName: 'Chetan', lastName: 'Verma', gender: 'MALE', phone: `98300${suffix}`, email: `chetan.${suffix}@example.com` });

    // 6. Org B Resident & Stay (Cross-tenant check)
    const resB = await residentRepo.createForOrganization(orgB.id, { residentCode: `RES-OPB-${suffix}`, firstName: 'Dev', lastName: 'Patel', gender: 'MALE', phone: `98400${suffix}`, email: `dev.${suffix}@example.com` });

    results.scaffoldComplete = true;
    console.log('✅ Scenario 1-9 Passed: Data scaffolding complete (Org A: 3 Residents [Active, CheckedOut, NoStay], Bed Occupied, Mess Sub, ₹5k Invoice Dues; Org B: 1 Resident)');

    // 10. Execute Operational List Query
    const opListAll = await residentRepo.findOperationalList(orgA.id, { page: 1, pageSize: 10 });
    if (opListAll.items.length === 3 && opListAll.total === 3) {
      results.operationalListExecuted = true;
      console.log('✅ Scenario 10 Passed: findOperationalList returned all 3 Org A residents in single query');
    }

    // 11. Pagination Verification
    const page1 = await residentRepo.findOperationalList(orgA.id, { page: 1, pageSize: 2 });
    if (page1.items.length === 2 && page1.total === 3 && page1.totalPages === 2) {
      results.paginationVerified = true;
      console.log('✅ Scenario 11 Passed: Server-side pagination verified (Page 1 of 2, pageSize=2)');
    }

    // 12. Search Verifications
    const searchName = await residentRepo.findOperationalList(orgA.id, { search: 'aarav' });
    if (searchName.items.length === 1 && searchName.items[0].residentId === res1.id) {
      results.searchByNameVerified = true;
      console.log('✅ Scenario 12a Passed: Search by first_name ("aarav") returned Resident 1');
    }

    const searchPhone = await residentRepo.findOperationalList(orgA.id, { search: `98200${suffix}` });
    if (searchPhone.items.length === 1 && searchPhone.items[0].residentId === res2.id) {
      results.searchByPhoneVerified = true;
      console.log('✅ Scenario 12b Passed: Search by phone returned Resident 2');
    }

    const searchCode = await residentRepo.findOperationalList(orgA.id, { search: `RES-OP3-${suffix}` });
    if (searchCode.items.length === 1 && searchCode.items[0].residentId === res3.id) {
      results.searchByCodeVerified = true;
      console.log('✅ Scenario 12c Passed: Search by resident_code returned Resident 3');
    }

    // 13. Stay Status Filter Verifications
    const filterActive = await residentRepo.findOperationalList(orgA.id, { stayStatus: 'ACTIVE' });
    if (filterActive.items.length === 1 && filterActive.items[0].residentId === res1.id) {
      results.stayStatusActiveVerified = true;
      console.log('✅ Scenario 13a Passed: stayStatus=ACTIVE returned only Resident 1');
    }

    const filterCheckedOut = await residentRepo.findOperationalList(orgA.id, { stayStatus: 'CHECKED_OUT' });
    if (filterCheckedOut.items.length === 1 && filterCheckedOut.items[0].residentId === res2.id) {
      results.stayStatusCheckedOutVerified = true;
      console.log('✅ Scenario 13b Passed: stayStatus=CHECKED_OUT returned only Resident 2');
    }

    const filterNoStay = await residentRepo.findOperationalList(orgA.id, { stayStatus: 'NO_STAY' });
    if (filterNoStay.items.length === 1 && filterNoStay.items[0].residentId === res3.id) {
      results.stayStatusNoStayVerified = true;
      console.log('✅ Scenario 13c Passed: stayStatus=NO_STAY returned only Resident 3');
    }

    // 14-16. Location Hierarchy Filters
    const filterProp = await residentRepo.findOperationalList(orgA.id, { propertyId: propA.id });
    if (filterProp.items.length === 1 && filterProp.items[0].residentId === res1.id) {
      results.propertyFilterVerified = true;
      console.log('✅ Scenario 14 Passed: propertyId filter returned resident occupying property');
    }

    const filterBldg = await residentRepo.findOperationalList(orgA.id, { buildingId: bldgA.id });
    if (filterBldg.items.length === 1 && filterBldg.items[0].residentId === res1.id) {
      results.buildingFilterVerified = true;
      console.log('✅ Scenario 15 Passed: buildingId filter returned resident occupying building');
    }

    const filterFloor = await residentRepo.findOperationalList(orgA.id, { floorId: floorA1.id });
    if (filterFloor.items.length === 1 && filterFloor.items[0].residentId === res1.id) {
      results.floorFilterVerified = true;
      console.log('✅ Scenario 16 Passed: floorId filter returned resident occupying floor');
    }

    // 17. Mess Subscription Filter
    const filterMessActive = await residentRepo.findOperationalList(orgA.id, { messStatus: 'ACTIVE' });
    if (filterMessActive.items.length === 1 && filterMessActive.items[0].residentId === res1.id) {
      results.messFilterActiveVerified = true;
      console.log('✅ Scenario 17a Passed: messStatus=ACTIVE returned Resident 1');
    }

    const filterMessNone = await residentRepo.findOperationalList(orgA.id, { messStatus: 'NONE' });
    if (filterMessNone.items.length === 2) {
      results.messFilterNoneVerified = true;
      console.log('✅ Scenario 17b Passed: messStatus=NONE returned Residents 2 & 3');
    }

    // 18. Billing Dues Filter
    const filterBillingDue = await residentRepo.findOperationalList(orgA.id, { billingStatus: 'DUE' });
    if (filterBillingDue.items.length === 1 && filterBillingDue.items[0].residentId === res1.id) {
      results.billingFilterDueVerified = true;
      console.log('✅ Scenario 18a Passed: billingStatus=DUE returned Resident 1 (₹5,000 outstanding)');
    }

    const filterBillingPaid = await residentRepo.findOperationalList(orgA.id, { billingStatus: 'PAID' });
    if (filterBillingPaid.items.length === 2) {
      results.billingFilterPaidVerified = true;
      console.log('✅ Scenario 18b Passed: billingStatus=PAID returned Residents 2 & 3 (₹0 dues)');
    }

    // 19-20. Operational Summary & Dues Verification
    const summaryA = await residentRepo.getOperationalSummary(orgA.id);
    if (
      summaryA.totalResidents === 3 &&
      summaryA.activeResidents === 1 &&
      summaryA.checkedOutResidents === 1 &&
      summaryA.residentsWithoutStay === 1 &&
      summaryA.occupiedBeds === 1 &&
      summaryA.outstandingAmount === 5000
    ) {
      results.summaryCountsVerified = true;
      results.outstandingBalanceVerified = true;
      console.log('✅ Scenario 19-20 Passed: PostgreSQL summary metrics verified (Total=3, Active=1, CheckedOut=1, NoStay=1, OccupiedBeds=1, Dues=₹5,000)');
    }

    // 21. Cross-Tenant Isolation
    const listB = await residentRepo.findOperationalList(orgB.id, { page: 1, pageSize: 10 });
    const summaryB = await residentRepo.getOperationalSummary(orgB.id);
    if (listB.total === 1 && listB.items[0].residentId === resB.id && summaryB.totalResidents === 1 && summaryB.outstandingAmount === 0) {
      results.crossTenantIsolationVerified = true;
      console.log('✅ Scenario 21 Passed: Cross-tenant isolation verified (Org B isolated from Org A data)');
    }

    // 22. Deterministic Ordering (ACTIVE stays first, then name ASC)
    if (opListAll.items[0].residentId === res1.id && opListAll.items[0].stayStatus === 'ACTIVE') {
      results.deterministicOrderingVerified = true;
      console.log('✅ Scenario 22 Passed: Deterministic ordering verified (ACTIVE stay resident listed first)');
    }

    // 23. No Duplicate Rows Caused by Joins
    const ids = opListAll.items.map((i) => i.residentId);
    const uniqueIds = new Set(ids);
    if (ids.length === uniqueIds.size) {
      results.noDuplicateRowsVerified = true;
      console.log('✅ Scenario 23 Passed: Zero duplicate resident rows caused by table joins');
    }
  } catch (err) {
    console.error('❌ Physical E2E Failed with exception:', err);
  } finally {
    console.log('\n================================================');
    console.log('RESIDENT OPERATIONAL DASHBOARD E2E RESULT');
    console.log('================================================\n');
    console.log(JSON.stringify(results, null, 2));

    const allPassed = Object.values(results).every((val) => val === true);
    await dbService.shutdown();
    if (allPassed) {
      console.log('\n🎉 RESIDENT OPERATIONAL DASHBOARD E2E PASSED 100%\n');
      process.exit(0);
    } else {
      console.error('\n❌ SOME VERIFICATIONS FAILED\n');
      process.exit(1);
    }
  }
}

if (require.main === module) {
  runResidentOperationalDashboardE2EVerification().catch(console.error);
}
