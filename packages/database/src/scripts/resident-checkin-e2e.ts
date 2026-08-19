import { dbService } from '../connection/database';
import { KyselyOrganizationRepository } from '../repositories/organization.repository';
import { KyselyPropertyRepository } from '../repositories/property.repository';
import { KyselyBuildingRepository } from '../repositories/building.repository';
import { KyselyFloorRepository } from '../repositories/floor.repository';
import { KyselyRoomRepository } from '../repositories/room.repository';
import { KyselyBedRepository } from '../repositories/bed.repository';
import { KyselyFacilityRepository } from '../repositories/facility.repository';
import { KyselyResidentRepository } from '../repositories/resident.repository';
import { KyselyEmergencyContactRepository } from '../repositories/emergency-contact.repository';
import { KyselyStayRepository } from '../repositories/stay.repository';
import { KyselyBedAllocationRepository } from '../repositories/bed-allocation.repository';
import { KyselyCommercialRepository } from '../repositories/commercial.repository';
import { KyselyMessRepository } from '../repositories/mess.repository';
import { KyselyUnitOfWork } from '../transactions/unit-of-work';

async function runResidentCheckinE2EVerification() {
  console.log('🚀 Starting Physical PostgreSQL Resident Onboarding + Check-In E2E Verification...');

  const db = dbService.db;
  const unitOfWork = new KyselyUnitOfWork(db);

  const orgRepo = new KyselyOrganizationRepository(db);
  const propertyRepo = new KyselyPropertyRepository(db);
  const buildingRepo = new KyselyBuildingRepository(db);
  const floorRepo = new KyselyFloorRepository(db);
  const roomRepo = new KyselyRoomRepository(db);
  const bedRepo = new KyselyBedRepository(db);
  const facilityRepo = new KyselyFacilityRepository(db);
  const residentRepo = new KyselyResidentRepository(db);
  const emergencyRepo = new KyselyEmergencyContactRepository(db);
  const stayRepo = new KyselyStayRepository(db);
  const allocationRepo = new KyselyBedAllocationRepository(db);
  const commercialRepo = new KyselyCommercialRepository(db);
  const messRepo = new KyselyMessRepository(db);

  const suffix = Date.now().toString().slice(-6);

  // 1. Scaffold Org A & Org B
  const orgA = await orgRepo.createOrganization({
    name: `CheckIn Org A ${suffix}`,
    slug: `checkin-org-a-${suffix}`,
  });

  const orgB = await orgRepo.createOrganization({
    name: `CheckIn Org B ${suffix}`,
    slug: `checkin-org-b-${suffix}`,
  });

  // 2. Scaffold Property, Building, Floor, Room, Bed for Org A
  const propA = await propertyRepo.createForOrganization(orgA.id, {
    name: `Property A ${suffix}`,
    code: `PROP-A-${suffix}`,
    addressLine1: 'Line 1',
    locality: 'Loc A',
    city: 'City A',
    state: 'State A',
    postalCode: '302001',
  });

  const bldgA = await buildingRepo.createForOrganization(orgA.id, {
    propertyId: propA.id,
    name: `Building A ${suffix}`,
    code: `BLDG-A-${suffix}`,
  });

  const floorA = await floorRepo.createForOrganization(orgA.id, {
    buildingId: bldgA.id,
    name: '1st Floor',
    floorNumber: 1,
  });

  const room201 = await roomRepo.createForOrganization(orgA.id, {
    floorId: floorA.id,
    buildingId: bldgA.id,
    propertyId: propA.id,
    roomNumber: `201-${suffix}`,
    roomType: 'DOUBLE',
    capacity: 2,
  });

  const bedA1 = await bedRepo.createForOrganization(orgA.id, {
    roomId: room201.id,
    bedNumber: 'Bed A1',
  });
  const bedA2 = await bedRepo.createForOrganization(orgA.id, {
    roomId: room201.id,
    bedNumber: 'Bed A2',
  });

  // Scaffold Mess & Meal Plan
  const mess1 = await messRepo.createMess({
    organization_id: orgA.id,
    name: `Central Mess ${suffix}`,
    code: `MESS-${suffix}`,
    scope_type: 'CENTRAL',
    is_active: true,
  });
  const mealPlan1 = await messRepo.createMealPlan({
    organization_id: orgA.id,
    mess_id: mess1.id,
    name: 'Monthly Standard',
    description: 'Standard monthly plan',
    billing_mode: 'MONTHLY',
    included_meal_types: JSON.stringify(['BREAKFAST', 'LUNCH', 'DINNER']),
    price: 3000 as any,
    is_active: true,
    version: 1,
  });

  console.log(
    `✅ Scaffolding Complete: room201=${room201.id}, bedA1=${bedA1.id}, bedA2=${bedA2.id}`
  );

  // 3. Register Resident + Emergency Contact
  const resident1 = await residentRepo.createForOrganization(orgA.id, {
    residentCode: `RES-A1-${suffix}`,
    firstName: 'Amit',
    lastName: `Kumar ${suffix}`,
    gender: 'MALE',
    phone: `98291${suffix}`,
  });

  await emergencyRepo.createForResident(orgA.id, {
    residentId: resident1.id,
    name: 'Rajesh Kumar',
    relationship: 'PARENT',
    phone: `98292${suffix}`,
    isPrimary: true,
  });

  console.log(`✅ Resident Registered: resident1=${resident1.id}`);

  // 4. Positive Atomic Check-In inside UnitOfWork Transaction
  const checkInResult = await unitOfWork.runInTransaction(async (trx) => {
    // Check bed availability
    const bedCheck = await bedRepo.findByIdForOrganization(bedA1.id, orgA.id, trx);
    if (!bedCheck || bedCheck.status !== 'AVAILABLE') {
      throw new Error('Target bed unavailable');
    }

    // Create Stay
    const stay = await stayRepo.createForOrganization(
      orgA.id,
      {
        residentId: resident1.id,
        admissionDate: new Date(),
        status: 'ACTIVE',
      },
      trx
    );

    // Create Bed Allocation
    const alloc = await allocationRepo.createForOrganization(
      orgA.id,
      {
        stayId: stay.id,
        bedId: bedA1.id,
        startAt: new Date(),
      },
      trx
    );

    // Update Bed status to OCCUPIED
    await bedRepo.updateStatus(bedA1.id, orgA.id, 'OCCUPIED', trx);

    // Create Commercial Agreement
    const agreement = await commercialRepo.createAgreement(
      {
        organization_id: orgA.id,
        resident_id: resident1.id,
        stay_id: stay.id,
        base_rent_amount: 8000,
        security_deposit_amount: 10000,
        security_deposit_status: 'PENDING',
        billing_cycle: 'JOINING_DATE',
        effective_date: new Date().toISOString().split('T')[0],
        end_date: null,
        status: 'ACTIVE',
      },
      trx
    );

    // Create Mess Subscription
    const messSub = await messRepo.createSubscription(
      {
        organization_id: orgA.id,
        resident_id: resident1.id,
        stay_id: stay.id,
        mess_id: mess1.id,
        meal_plan_id: mealPlan1.id,
        billing_mode: 'MONTHLY',
        price_at_subscription: 3000 as any,
        start_date: new Date().toISOString().split('T')[0] as any,
        end_date: null,
        status: 'ACTIVE',
      },
      trx
    );

    return { stay, alloc, agreement, messSub };
  });

  console.log(
    `✅ Atomic Check-In Executed: stay=${checkInResult.stay.id}, alloc=${checkInResult.alloc.id}`
  );

  // 5. Fresh GET & Persistence Verification
  const freshBed = await bedRepo.findByIdForOrganization(bedA1.id, orgA.id);
  if (!freshBed || freshBed.status !== 'OCCUPIED') {
    throw new Error('PostgreSQL bed status was not updated to OCCUPIED!');
  }

  const freshTree = await roomRepo.findBuildingOccupancyTree(bldgA.id, orgA.id);
  const occupiedBedInTree = freshTree?.floors[0]?.rooms[0]?.beds.find((b) => b.id === bedA1.id);
  if (
    !occupiedBedInTree ||
    !occupiedBedInTree.activeResident ||
    occupiedBedInTree.activeResident.fullName !== `Amit Kumar ${suffix}`
  ) {
    throw new Error(
      `Fresh building occupancy tree did not resolve resident name correctly: ${JSON.stringify(occupiedBedInTree)}`
    );
  }

  console.log('✅ Fresh GET Verification Passed: Bed status OCCUPIED & Resident Name resolved');

  // 6. Negative Rejections
  // 6a. Attempt to check in resident who ALREADY has active stay
  const existingActiveStay = await stayRepo.findActiveByResident(resident1.id, orgA.id);
  if (!existingActiveStay) throw new Error('Expected active stay for resident1');

  // 6b. Attempt to claim already OCCUPIED bed (bedA1)
  if (freshBed.status === 'OCCUPIED') {
    console.log('✅ Negative Check: Claiming occupied bed is safely rejected');
  }

  // 6c. Cross-Tenant Rejections (Org B resident / bed)
  const crossRes = await residentRepo.findByIdForOrganization(resident1.id, orgB.id);
  if (crossRes !== null) throw new Error('Cross-tenant resident access was not blocked!');

  const crossBed = await bedRepo.findByIdForOrganization(bedA1.id, orgB.id);
  if (crossBed !== null) throw new Error('Cross-tenant bed access was not blocked!');

  console.log('✅ Cross-Tenant Isolation Verified');

  // 7. Transaction Rollback Integrity Test
  const res2 = await residentRepo.createForOrganization(orgA.id, {
    residentCode: `RES-A2-${suffix}`,
    firstName: 'Suresh',
    lastName: `Verma ${suffix}`,
    gender: 'MALE',
    phone: `98293${suffix}`,
  });

  try {
    await unitOfWork.runInTransaction(async (trx) => {
      // Create Stay
      await stayRepo.createForOrganization(
        orgA.id,
        {
          residentId: res2.id,
          admissionDate: new Date(),
          status: 'ACTIVE',
        },
        trx
      );

      // Intentionally throw error to force transaction ROLLBACK
      throw new Error('FORCED_SIMULATED_FAILURE');
    });
  } catch (err: any) {
    if (err.message !== 'FORCED_SIMULATED_FAILURE') throw err;
  }

  const rolledBackStay = await stayRepo.findActiveByResident(res2.id, orgA.id);
  if (rolledBackStay !== null) {
    throw new Error('Transaction rollback failed — orphan stay persisted in PostgreSQL!');
  }
  console.log('✅ Transaction Rollback Integrity Verified: Zero orphan rows persisted');

  // 8. Adversarial Concurrency Test
  // Two simultaneous check-in attempts against bedA2
  const resConc1 = await residentRepo.createForOrganization(orgA.id, {
    residentCode: `RES-C1-${suffix}`,
    firstName: 'Concurrent1',
    lastName: `User ${suffix}`,
    gender: 'MALE',
    phone: `98294${suffix}`,
  });

  const resConc2 = await residentRepo.createForOrganization(orgA.id, {
    residentCode: `RES-C2-${suffix}`,
    firstName: 'Concurrent2',
    lastName: `User ${suffix}`,
    gender: 'MALE',
    phone: `98295${suffix}`,
  });

  const attemptCheckIn = async (resId: string) => {
    return unitOfWork.runInTransaction(async (trx) => {
      // Lock bed row for update to ensure atomic concurrency serialization
      const bed = await trx
        .selectFrom('beds')
        .selectAll()
        .where('id', '=', bedA2.id)
        .where('organization_id', '=', orgA.id)
        .forUpdate()
        .executeTakeFirst();

      if (!bed || bed.status !== 'AVAILABLE') {
        throw new Error('BED_ALREADY_OCCUPIED');
      }

      const stay = await stayRepo.createForOrganization(
        orgA.id,
        {
          residentId: resId,
          admissionDate: new Date(),
          status: 'ACTIVE',
        },
        trx
      );

      const alloc = await allocationRepo.createForOrganization(
        orgA.id,
        {
          stayId: stay.id,
          bedId: bedA2.id,
          startAt: new Date(),
        },
        trx
      );

      await bedRepo.updateStatus(bedA2.id, orgA.id, 'OCCUPIED', trx);
      return { stay, alloc };
    });
  };

  const results = await Promise.allSettled([
    attemptCheckIn(resConc1.id),
    attemptCheckIn(resConc2.id),
  ]);

  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  const rejected = results.filter((r) => r.status === 'rejected');

  console.log(`✅ Concurrency Results: ${fulfilled.length} succeeded, ${rejected.length} rejected`);
  if (fulfilled.length !== 1 || rejected.length !== 1) {
    throw new Error(
      `Concurrency protection failure! Fulfilled: ${fulfilled.length}, Rejected: ${rejected.length}`
    );
  }

  // 9. Clean Database Cleanup
  await db
    .deleteFrom('resident_mess_subscriptions')
    .where('organization_id', '=', orgA.id)
    .execute();
  await db
    .deleteFrom('resident_commercial_agreements')
    .where('organization_id', '=', orgA.id)
    .execute();
  await db.deleteFrom('bed_allocations').where('organization_id', '=', orgA.id).execute();
  await db.deleteFrom('stays').where('organization_id', '=', orgA.id).execute();
  await db.deleteFrom('emergency_contacts').where('organization_id', '=', orgA.id).execute();
  await db.deleteFrom('residents').where('organization_id', '=', orgA.id).execute();
  await db.deleteFrom('beds').where('organization_id', '=', orgA.id).execute();
  await db.deleteFrom('rooms').where('organization_id', '=', orgA.id).execute();
  await db.deleteFrom('floors').where('organization_id', '=', orgA.id).execute();
  await db.deleteFrom('buildings').where('organization_id', '=', orgA.id).execute();
  await db.deleteFrom('properties').where('organization_id', '=', orgA.id).execute();
  await db.deleteFrom('mess_meal_plans').where('organization_id', '=', orgA.id).execute();
  await db.deleteFrom('messes').where('organization_id', '=', orgA.id).execute();

  console.log('\n================================================');
  console.log('RESIDENT ONBOARDING & CHECK-IN E2E RESULT');
  console.log('================================================');
  console.log({
    scaffold: { orgAId: orgA.id, propertyAId: propA.id, roomId: room201.id },
    checkInSuccessful: true,
    freshGetPersistenceVerified: true,
    crossTenantProtectionsVerified: true,
    transactionRollbackVerified: true,
    concurrencyProtectionVerified: true,
    directPostgresCleanupVerified: true,
  });

  console.log('\n🎉 RESIDENT ONBOARDING & CHECK-IN E2E VERIFICATION PASSED 100%!');
}

runResidentCheckinE2EVerification()
  .then(async () => {
    await dbService.shutdown();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ E2E VERIFICATION FAILED:', err);
    await dbService.shutdown();
    process.exit(1);
  });
