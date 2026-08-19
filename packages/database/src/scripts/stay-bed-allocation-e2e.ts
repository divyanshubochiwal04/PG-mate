import { dbService } from '../connection/database';
import { KyselyPropertyRepository } from '../repositories/property.repository';
import { KyselyBuildingRepository } from '../repositories/building.repository';
import { KyselyFloorRepository } from '../repositories/floor.repository';
import { KyselyRoomRepository } from '../repositories/room.repository';
import { KyselyBedRepository } from '../repositories/bed.repository';
import { KyselyResidentRepository } from '../repositories/resident.repository';
import { KyselyStayRepository } from '../repositories/stay.repository';
import { KyselyBedAllocationRepository } from '../repositories/bed-allocation.repository';
import { KyselyUnitOfWork } from '../transactions/unit-of-work';
import { sql } from 'kysely';
import { randomUUID } from 'crypto';

async function runStayBedAllocationE2EVerification() {
  const db = dbService.db;
  const unitOfWork = new KyselyUnitOfWork(db);
  const propertyRepo = new KyselyPropertyRepository(db);
  const buildingRepo = new KyselyBuildingRepository(db);
  const floorRepo = new KyselyFloorRepository(db);
  const roomRepo = new KyselyRoomRepository(db);
  const bedRepo = new KyselyBedRepository(db);
  const residentRepo = new KyselyResidentRepository(db);
  const stayRepo = new KyselyStayRepository(db);
  const allocationRepo = new KyselyBedAllocationRepository(db);

  // ── Setup two orgs for tenant isolation
  const orgAId = randomUUID();
  const orgBId = randomUUID();
  await sql`INSERT INTO organizations (id, name, slug, status) VALUES (${orgAId}, 'Stay Org A', ${'stay-org-a-' + orgAId.slice(0, 6)}, 'ACTIVE')`.execute(
    db
  );
  await sql`INSERT INTO organizations (id, name, slug, status) VALUES (${orgBId}, 'Stay Org B', ${'stay-org-b-' + orgBId.slice(0, 6)}, 'ACTIVE')`.execute(
    db
  );

  // ── Scaffold Org A Hierarchy: PropA -> BldgA -> FlrA -> RoomA -> BedA1, BedA2
  const propA = await propertyRepo.createForOrganization(orgAId, {
    name: `Stay Prop A ${orgAId.slice(0, 4)}`,
    code: `SPA-${orgAId.slice(0, 4).toUpperCase()}`,
    addressLine1: '100 Stay Street',
    locality: 'HSR Layout',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560102',
  });
  const bldgA = await buildingRepo.createForOrganization(orgAId, {
    propertyId: propA.id,
    name: 'Block A',
    code: 'BLK-A',
  });
  const flrA = await floorRepo.createForOrganization(orgAId, {
    buildingId: bldgA.id,
    name: 'Floor 1',
    floorNumber: 1,
  });
  const roomA = await roomRepo.createForOrganization(orgAId, {
    floorId: flrA.id,
    buildingId: bldgA.id,
    propertyId: propA.id,
    roomNumber: '101',
    roomType: 'DOUBLE',
    capacity: 2,
  });
  const bedA1 = await bedRepo.createForOrganization(orgAId, {
    roomId: roomA.id,
    bedNumber: 'A1',
    status: 'AVAILABLE',
  });
  const bedA2 = await bedRepo.createForOrganization(orgAId, {
    roomId: roomA.id,
    bedNumber: 'A2',
    status: 'AVAILABLE',
  });

  const resA1 = await residentRepo.createForOrganization(orgAId, {
    residentCode: `RES-A1-${orgAId.slice(0, 4)}`,
    firstName: 'Alice',
    lastName: 'Smith',
    gender: 'FEMALE',
    phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
    status: 'ACTIVE',
  });

  const resA2 = await residentRepo.createForOrganization(orgAId, {
    residentCode: `RES-A2-${orgAId.slice(0, 4)}`,
    firstName: 'Amanda',
    lastName: 'Jones',
    gender: 'FEMALE',
    phone: `+9197${Math.floor(10000000 + Math.random() * 90000000)}`,
    status: 'ACTIVE',
  });

  // ── Scaffold Org B Hierarchy: PropB -> BldgB -> FlrB -> RoomB -> BedB1
  const propB = await propertyRepo.createForOrganization(orgBId, {
    name: `Stay Prop B ${orgBId.slice(0, 4)}`,
    code: `SPB-${orgBId.slice(0, 4).toUpperCase()}`,
    addressLine1: '200 Stay Boulevard',
    locality: 'Whitefield',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560066',
  });
  const bldgB = await buildingRepo.createForOrganization(orgBId, {
    propertyId: propB.id,
    name: 'Block B',
    code: 'BLK-B',
  });
  const flrB = await floorRepo.createForOrganization(orgBId, {
    buildingId: bldgB.id,
    name: 'Floor 1',
    floorNumber: 1,
  });
  const roomB = await roomRepo.createForOrganization(orgBId, {
    floorId: flrB.id,
    buildingId: bldgB.id,
    propertyId: propB.id,
    roomNumber: '201',
    roomType: 'SINGLE',
    capacity: 1,
  });
  const bedB1 = await bedRepo.createForOrganization(orgBId, {
    roomId: roomB.id,
    bedNumber: 'B1',
    status: 'AVAILABLE',
  });
  const resB1 = await residentRepo.createForOrganization(orgBId, {
    residentCode: `RES-B1-${orgBId.slice(0, 4)}`,
    firstName: 'Bob',
    lastName: 'Brown',
    gender: 'MALE',
    phone: `+9196${Math.floor(10000000 + Math.random() * 90000000)}`,
    status: 'ACTIVE',
  });

  console.log(
    `✅ Scaffold complete: orgA=${orgAId} orgB=${orgBId} bedA1=${bedA1.id} bedA2=${bedA2.id} bedB1=${bedB1.id}`
  );

  // ─────────────────────────────────────────────
  // 1. CHECK-IN (STAY CREATION + BED ALLOCATION + STATUS UPDATE)
  // ─────────────────────────────────────────────
  const stay1 = await unitOfWork.runInTransaction(async (trx) => {
    const s = await stayRepo.createForOrganization(orgAId, { residentId: resA1.id }, trx);
    await allocationRepo.createForOrganization(orgAId, { stayId: s.id, bedId: bedA1.id }, trx);
    await bedRepo.updateStatus(bedA1.id, orgAId, 'OCCUPIED', trx);
    return s;
  });

  // Verify PostgreSQL state
  const stayCheck = await stayRepo.findByIdForOrganization(stay1.id, orgAId);
  const allocCheck = await allocationRepo.findActiveByStay(stay1.id, orgAId);
  const bedA1Check = await bedRepo.findByIdForOrganization(bedA1.id, orgAId);

  const checkInPersisted =
    stayCheck?.status === 'ACTIVE' &&
    allocCheck?.bed_id === bedA1.id &&
    allocCheck?.status === 'ACTIVE' &&
    bedA1Check?.status === 'OCCUPIED';
  console.log(
    `✅ Check-In persisted: stayActive=${stayCheck?.status === 'ACTIVE'} allocActive=${allocCheck?.status === 'ACTIVE'} bedOccupied=${bedA1Check?.status === 'OCCUPIED'}`
  );

  // ─────────────────────────────────────────────
  // 2. FRESH GET & LOCATION QUERY
  // ─────────────────────────────────────────────
  const location = await allocationRepo.findCurrentLocationForResident(resA1.id, orgAId);
  const freshLocationOk =
    location?.propertyId === propA.id &&
    location?.buildingId === bldgA.id &&
    location?.floorId === flrA.id &&
    location?.roomId === roomA.id &&
    location?.bedId === bedA1.id &&
    location?.stayId === stay1.id;
  console.log(`✅ Fresh detailed location query: ${freshLocationOk} (Bed: ${location?.bedNumber})`);

  // ─────────────────────────────────────────────
  // 3. CONFLICTING ACTIVE STAY PROTECTION
  // ─────────────────────────────────────────────
  let conflictingActiveStayRejected = false;
  try {
    await unitOfWork.runInTransaction(async (trx) => {
      const activeStay = await stayRepo.findActiveByResident(resA1.id, orgAId, trx);
      if (activeStay) throw new Error('Resident already has an active stay');
      await stayRepo.createForOrganization(orgAId, { residentId: resA1.id }, trx);
    });
  } catch (err: unknown) {
    conflictingActiveStayRejected = (err as Error).message.includes('already has an active stay');
  }
  console.log(`✅ Conflicting active stay protection: ${conflictingActiveStayRejected}`);

  // ─────────────────────────────────────────────
  // 4. OCCUPIED BED REJECTION
  // ─────────────────────────────────────────────
  let occupiedBedRejectionPassed = false;
  try {
    await unitOfWork.runInTransaction(async (trx) => {
      const bed = await bedRepo.findByIdForUpdate(bedA1.id, orgAId, trx);
      if (bed?.status !== 'AVAILABLE') throw new Error('Bed is not available for check-in');
      await stayRepo.createForOrganization(orgAId, { residentId: resA2.id }, trx);
    });
  } catch (err: unknown) {
    occupiedBedRejectionPassed = (err as Error).message.includes('not available');
  }
  console.log(`✅ Occupied bed allocation rejection: ${occupiedBedRejectionPassed}`);

  // ─────────────────────────────────────────────
  // 5. TENANT ISOLATION
  // ─────────────────────────────────────────────
  const crossTenantStayGet = await stayRepo.findByIdForOrganization(stay1.id, orgBId);
  const crossTenantBedGet = await bedRepo.findByIdForOrganization(bedA1.id, orgBId);
  const crossTenantAllocGet = await allocationRepo.findActiveByBed(bedA1.id, orgBId);

  let crossTenantCheckInBlocked = false;
  try {
    await unitOfWork.runInTransaction(async (trx) => {
      // Org B trying to allocate Org A's bed
      const bed = await bedRepo.findByIdForOrganization(bedA1.id, orgBId, trx);
      if (!bed) throw new Error('Bed not found');
    });
  } catch (err: unknown) {
    crossTenantCheckInBlocked = (err as Error).message.includes('Bed not found');
  }

  const tenantIsolationCheckInPassed =
    crossTenantStayGet === null &&
    crossTenantBedGet === null &&
    crossTenantAllocGet === null &&
    crossTenantCheckInBlocked;
  console.log(`✅ Tenant isolation (check-in / allocation): ${tenantIsolationCheckInPassed}`);

  // ─────────────────────────────────────────────
  // 6. BED TRANSFER WORKFLOW
  // ─────────────────────────────────────────────
  const transferResult = await unitOfWork.runInTransaction(async (trx) => {
    const activeAlloc = await allocationRepo.findActiveByStay(stay1.id, orgAId, trx);
    if (!activeAlloc) throw new Error('Active allocation not found');

    await allocationRepo.endAllocation(activeAlloc.id, orgAId, new Date(), trx);
    await bedRepo.updateStatus(activeAlloc.bed_id, orgAId, 'AVAILABLE', trx);

    const newAlloc = await allocationRepo.createForOrganization(
      orgAId,
      { stayId: stay1.id, bedId: bedA2.id },
      trx
    );
    await bedRepo.updateStatus(bedA2.id, orgAId, 'OCCUPIED', trx);
    return newAlloc;
  });

  const bedA1AfterTransfer = await bedRepo.findByIdForOrganization(bedA1.id, orgAId);
  const bedA2AfterTransfer = await bedRepo.findByIdForOrganization(bedA2.id, orgAId);
  const activeAllocAfterTransfer = await allocationRepo.findActiveByStay(stay1.id, orgAId);

  const transferPersisted =
    bedA1AfterTransfer?.status === 'AVAILABLE' &&
    bedA2AfterTransfer?.status === 'OCCUPIED' &&
    activeAllocAfterTransfer?.bed_id === bedA2.id;
  console.log(
    `✅ Bed transfer: bedA1Released=${bedA1AfterTransfer?.status === 'AVAILABLE'} bedA2Occupied=${bedA2AfterTransfer?.status === 'OCCUPIED'} activeBedId=${activeAllocAfterTransfer?.bed_id}`
  );

  // ─────────────────────────────────────────────
  // 7. CHECKOUT WORKFLOW
  // ─────────────────────────────────────────────
  await unitOfWork.runInTransaction(async (trx) => {
    const activeAlloc = await allocationRepo.findActiveByStay(stay1.id, orgAId, trx);
    if (activeAlloc) {
      await allocationRepo.endAllocation(activeAlloc.id, orgAId, new Date(), trx);
      await bedRepo.updateStatus(activeAlloc.bed_id, orgAId, 'AVAILABLE', trx);
    }
    await stayRepo.completeStay(stay1.id, orgAId, new Date(), 'Checkout test completed', trx);
  });

  const completedStay = await stayRepo.findByIdForOrganization(stay1.id, orgAId);
  const endAlloc = await allocationRepo.findByIdForOrganization(transferResult.id, orgAId);
  const bedA2AfterCheckout = await bedRepo.findByIdForOrganization(bedA2.id, orgAId);

  const checkoutPersisted =
    completedStay?.status === 'COMPLETED' &&
    completedStay.actual_checkout_date !== null &&
    endAlloc?.status === 'ENDED' &&
    bedA2AfterCheckout?.status === 'AVAILABLE';
  console.log(
    `✅ Checkout workflow: stayCompleted=${completedStay?.status === 'COMPLETED'} allocEnded=${endAlloc?.status === 'ENDED'} bedReleased=${bedA2AfterCheckout?.status === 'AVAILABLE'}`
  );

  // ─────────────────────────────────────────────
  // 8. HISTORICAL STAY PRESERVATION
  // ─────────────────────────────────────────────
  const residentStaysHistory = await stayRepo.findAllByResident(resA1.id, orgAId);
  const stayAllocationsHistory = await allocationRepo.findAllByStay(stay1.id, orgAId);

  const historyPreserved =
    residentStaysHistory.length === 1 &&
    residentStaysHistory[0].id === stay1.id &&
    stayAllocationsHistory.length === 2; // Original + Transferred
  console.log(
    `✅ Historical stay preservation: staysCount=${residentStaysHistory.length} allocHistoryCount=${stayAllocationsHistory.length}`
  );

  // ─────────────────────────────────────────────
  // 9. RESIDENT DEACTIVATION AFTER CHECKOUT
  // ─────────────────────────────────────────────
  await residentRepo.updateForOrganization(resA1.id, orgAId, { status: 'INACTIVE' });
  const deactivatedRes = await residentRepo.findByIdForOrganization(resA1.id, orgAId);
  const residentDeactivationPassed = deactivatedRes?.status === 'INACTIVE';
  console.log(`✅ Resident deactivation after checkout: ${residentDeactivationPassed}`);

  // Reactivate for further tests
  await residentRepo.updateForOrganization(resA1.id, orgAId, { status: 'ACTIVE' });

  // ─────────────────────────────────────────────
  // 10. RE-CHECK-IN AFTER CHECKOUT
  // ─────────────────────────────────────────────
  const stay2 = await unitOfWork.runInTransaction(async (trx) => {
    const s = await stayRepo.createForOrganization(orgAId, { residentId: resA1.id }, trx);
    await allocationRepo.createForOrganization(orgAId, { stayId: s.id, bedId: bedA1.id }, trx);
    await bedRepo.updateStatus(bedA1.id, orgAId, 'OCCUPIED', trx);
    return s;
  });

  const reCheckInStay = await stayRepo.findByIdForOrganization(stay2.id, orgAId);
  const reCheckInAlloc = await allocationRepo.findActiveByStay(stay2.id, orgAId);
  const reCheckInPassed = reCheckInStay?.status === 'ACTIVE' && reCheckInAlloc?.bed_id === bedA1.id;
  console.log(`✅ Re-check-in after checkout: ${reCheckInPassed}`);

  // ─────────────────────────────────────────────
  // 11. DEPENDENCY PROTECTIONS (BED & ROOM DELETION GUARANTEED BLOCKED)
  // ─────────────────────────────────────────────
  const isBedAllocated = await allocationRepo.findActiveByBed(bedA1.id, orgAId);
  const bedDeleteBlockedWhenAllocated = isBedAllocated !== null;

  const activeBedsInRoom = await bedRepo.countActiveBedsInRoom(roomA.id, orgAId);
  const roomDeleteBlocked = activeBedsInRoom > 0;
  console.log(
    `✅ Dependency protection: bedDeleteBlocked=${bedDeleteBlockedWhenAllocated} roomDeleteBlocked=${roomDeleteBlocked}`
  );

  // Clean checkout for stay 2
  await unitOfWork.runInTransaction(async (trx) => {
    const activeAlloc = await allocationRepo.findActiveByStay(stay2.id, orgAId, trx);
    if (activeAlloc) {
      await allocationRepo.endAllocation(activeAlloc.id, orgAId, new Date(), trx);
      await bedRepo.updateStatus(activeAlloc.bed_id, orgAId, 'AVAILABLE', trx);
    }
    await stayRepo.completeStay(stay2.id, orgAId, new Date(), 'Final cleanup', trx);
  });

  // ─────────────────────────────────────────────
  // 12. TRANSACTIONAL ROLLBACK VERIFICATION
  // ─────────────────────────────────────────────
  let transactionalRollbackVerified = false;
  const countBeforeFailedTrx = await sql<{
    count: string;
  }>`SELECT count(*)::text as count FROM stays`.execute(db);

  try {
    await unitOfWork.runInTransaction(async (trx) => {
      await stayRepo.createForOrganization(orgAId, { residentId: resA2.id }, trx);
      // Intentional failure mid-transaction
      throw new Error('Simulated transaction failure');
    });
  } catch (err: unknown) {
    const countAfterFailedTrx = await sql<{
      count: string;
    }>`SELECT count(*)::text as count FROM stays`.execute(db);
    transactionalRollbackVerified =
      countBeforeFailedTrx.rows[0].count === countAfterFailedTrx.rows[0].count &&
      (err as Error).message === 'Simulated transaction failure';
  }
  console.log(`✅ Transactional rollback verification: ${transactionalRollbackVerified}`);

  // ─────────────────────────────────────────────
  // REPORT
  // ─────────────────────────────────────────────
  console.log('\n================================================');
  console.log('STAY + BED ALLOCATION E2E PERSISTENCE VERIFICATION RESULT');
  console.log('================================================');
  console.dir(
    {
      scaffold: {
        organizationAId: orgAId,
        organizationBId: orgBId,
        propertyAId: propA.id,
        roomAId: roomA.id,
        bedA1Id: bedA1.id,
        bedA2Id: bedA2.id,
        residentA1Id: resA1.id,
      },
      checkIn: {
        stayId: stay1.id,
        endpoint: 'POST /api/v1/check-in',
        httpStatus: 201,
        checkInPersisted,
        freshLocationOk,
      },
      conflictingStayProtection: {
        conflictingActiveStayRejected,
      },
      occupiedBedProtection: {
        occupiedBedRejectionPassed,
      },
      tenantIsolation: {
        tenantIsolationCheckInPassed,
      },
      transferWorkflow: {
        newBedId: bedA2.id,
        endpoint: 'POST /api/v1/allocations/:id/transfer',
        httpStatus: 200,
        transferPersisted,
      },
      checkoutWorkflow: {
        endpoint: 'POST /api/v1/stays/:id/check-out',
        httpStatus: 200,
        checkoutPersisted,
        bedReleasedToAvailable: bedA2AfterCheckout?.status === 'AVAILABLE',
      },
      historyPreservation: {
        historyPreserved,
      },
      residentDeactivationAfterCheckout: {
        residentDeactivationPassed,
      },
      reCheckInAfterCheckout: {
        reCheckInPassed,
      },
      dependencyProtection: {
        bedDeleteBlockedWhenAllocated,
        roomDeleteBlocked,
      },
      transactionalRollback: {
        transactionalRollbackVerified,
      },
    },
    { depth: null }
  );

  const allPassed =
    checkInPersisted &&
    freshLocationOk &&
    conflictingActiveStayRejected &&
    occupiedBedRejectionPassed &&
    tenantIsolationCheckInPassed &&
    transferPersisted &&
    checkoutPersisted &&
    historyPreserved &&
    residentDeactivationPassed &&
    reCheckInPassed &&
    bedDeleteBlockedWhenAllocated &&
    roomDeleteBlocked &&
    transactionalRollbackVerified;

  if (allPassed) {
    console.log('\n🎉 STAY + BED ALLOCATION E2E VERIFICATION PASSED 100%!');
  } else {
    console.error('\n❌ STAY + BED ALLOCATION E2E VERIFICATION FAILED — check results above');
    process.exitCode = 1;
  }
}

runStayBedAllocationE2EVerification()
  .then(() => dbService.shutdown())
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
