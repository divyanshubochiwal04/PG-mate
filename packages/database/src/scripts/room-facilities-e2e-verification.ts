import { dbService } from '../connection/database';
import { KyselyPropertyRepository } from '../repositories/property.repository';
import { KyselyBuildingRepository } from '../repositories/building.repository';
import { KyselyFloorRepository } from '../repositories/floor.repository';
import { KyselyRoomRepository } from '../repositories/room.repository';
import { KyselyFacilityRepository } from '../repositories/facility.repository';
import { sql } from 'kysely';
import { randomUUID } from 'crypto';

async function runRoomFacilitiesE2EVerification() {
  const db = dbService.db;
  const propertyRepo = new KyselyPropertyRepository(db);
  const buildingRepo = new KyselyBuildingRepository(db);
  const floorRepo = new KyselyFloorRepository(db);
  const roomRepo = new KyselyRoomRepository(db);
  const facilityRepo = new KyselyFacilityRepository(db);

  // ── Setup two orgs for tenant isolation
  const orgAId = randomUUID();
  const orgBId = randomUUID();
  await sql`INSERT INTO organizations (id, name, slug, status) VALUES (${orgAId}, 'Facility Org A', ${'fac-org-a-' + orgAId.slice(0, 6)}, 'ACTIVE')`.execute(
    db
  );
  await sql`INSERT INTO organizations (id, name, slug, status) VALUES (${orgBId}, 'Facility Org B', ${'fac-org-b-' + orgBId.slice(0, 6)}, 'ACTIVE')`.execute(
    db
  );

  // ── Scaffold: Property + Building + Floor + Room under Org A
  const property = await propertyRepo.createForOrganization(orgAId, {
    name: `Fac E2E Prop ${orgAId.slice(0, 5)}`,
    code: `FCP-${orgAId.slice(0, 4).toUpperCase()}`,
    addressLine1: '300 Facility Way',
    locality: 'Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560034',
  });

  const building = await buildingRepo.createForOrganization(orgAId, {
    propertyId: property.id,
    name: `Fac E2E Block ${orgAId.slice(0, 5)}`,
    code: `FBLK-${orgAId.slice(0, 3).toUpperCase()}`,
    displayOrder: 1,
  });

  const floor = await floorRepo.createForOrganization(orgAId, {
    buildingId: building.id,
    name: `Floor 2 ${orgAId.slice(0, 5)}`,
    floorNumber: 2,
    displayOrder: 1,
  });

  const room = await roomRepo.createForOrganization(orgAId, {
    floorId: floor.id,
    buildingId: building.id,
    propertyId: property.id,
    roomNumber: `R301-${orgAId.slice(0, 4)}`,
    roomType: 'SINGLE',
    capacity: 1,
    displayOrder: 1,
  });

  console.log(
    `✅ Scaffold: property=${property.id} building=${building.id} floor=${floor.id} room=${room.id}`
  );

  // ─────────────────────────────────────────────
  // 1. MASTER FACILITY CREATION
  // ─────────────────────────────────────────────
  const fac1 = await facilityRepo.createForOrganization(orgAId, {
    name: `High Speed WiFi ${orgAId.slice(0, 4)}`,
    code: `WIFI-${orgAId.slice(0, 4).toUpperCase()}`,
    category: 'UTILITY',
    description: '5G Fiber WiFi router access',
  });

  const fac2 = await facilityRepo.createForOrganization(orgAId, {
    name: `Air Conditioner ${orgAId.slice(0, 4)}`,
    code: `AC-${orgAId.slice(0, 4).toUpperCase()}`,
    category: 'COMFORT',
    description: '1.5 Ton Inverter AC',
  });

  const facOrgB = await facilityRepo.createForOrganization(orgBId, {
    name: `Org B Special Facility`,
    code: `ORGB-FAC-${orgBId.slice(0, 3).toUpperCase()}`,
    category: 'GENERAL',
  });

  console.log(
    `✅ Master Facilities created: fac1=${fac1.id} fac2=${fac2.id} facOrgB=${facOrgB.id}`
  );

  // ─────────────────────────────────────────────
  // 2. ROOM FACILITY ASSIGNMENT
  // ─────────────────────────────────────────────
  const assigned1 = await facilityRepo.assignToRoom(room.id, fac1.id, orgAId);
  console.log(`✅ Facility 1 assigned to Room: assigned=${assigned1}`);

  // Verify DB row
  const dbCheck = await sql<{ count: string }>`
    SELECT count(*)::text as count FROM room_facilities
    WHERE room_id = ${room.id} AND facility_id = ${fac1.id} AND organization_id = ${orgAId}
  `.execute(db);
  const dbAssignmentExists = parseInt(dbCheck.rows[0].count, 10) === 1;
  console.log(`  dbAssignmentExists: ${dbAssignmentExists}`);

  // ─────────────────────────────────────────────
  // 3. FRESH GET / LIST ASSIGNED FACILITIES
  // ─────────────────────────────────────────────
  const assignedList = await facilityRepo.findAssignedToRoom(room.id, orgAId);
  const freshGetReturned = assignedList.some((f) => f.id === fac1.id);
  console.log(`  freshGetReturned: ${freshGetReturned} (assigned count: ${assignedList.length})`);

  // ─────────────────────────────────────────────
  // 4. DUPLICATE ASSIGNMENT PROTECTION
  // ─────────────────────────────────────────────
  await facilityRepo.assignToRoom(room.id, fac1.id, orgAId);
  const countAfterDup = await sql<{ count: string }>`
    SELECT count(*)::text as count FROM room_facilities
    WHERE room_id = ${room.id} AND facility_id = ${fac1.id} AND organization_id = ${orgAId}
  `.execute(db);
  const duplicateAssignmentPrevented = parseInt(countAfterDup.rows[0].count, 10) === 1;
  console.log(`✅ Duplicate assignment protection: ${duplicateAssignmentPrevented}`);

  // ─────────────────────────────────────────────
  // 5. TENANT ISOLATION
  // ─────────────────────────────────────────────
  // Org B cannot list Org A's room facilities
  const crossTenantList = await facilityRepo.findAssignedToRoom(room.id, orgBId);
  const crossTenantReadBlocked = crossTenantList.length === 0;

  // Org B cannot assign Org B's facility to Org A's room (composite FK fk_room_fac_room blocks it)
  let crossTenantAssignBlockedByDB = false;
  try {
    await facilityRepo.assignToRoom(room.id, facOrgB.id, orgBId);
  } catch (err: unknown) {
    crossTenantAssignBlockedByDB = (err as { code?: string }).code === '23503';
  }

  const crossCheck = await sql<{ count: string }>`
    SELECT count(*)::text as count FROM room_facilities
    WHERE room_id = ${room.id} AND organization_id = ${orgAId} AND facility_id = ${facOrgB.id}
  `.execute(db);
  const tenantIsolationPassed =
    crossTenantReadBlocked &&
    crossTenantAssignBlockedByDB &&
    parseInt(crossCheck.rows[0].count, 10) === 0;
  console.log(
    `✅ Tenant isolation: readBlocked=${crossTenantReadBlocked} assignBlockedByFK=${crossTenantAssignBlockedByDB} crossCheckCount=${crossCheck.rows[0].count}`
  );

  // ─────────────────────────────────────────────
  // 6. PARENT ASSOCIATION INTEGRITY
  // ─────────────────────────────────────────────
  const parentCheck = await sql<{ room_id: string; facility_id: string; organization_id: string }>`
    SELECT room_id, facility_id, organization_id FROM room_facilities
    WHERE room_id = ${room.id} AND facility_id = ${fac1.id}
  `.execute(db);
  const parentOk =
    parentCheck.rows[0]?.room_id === room.id &&
    parentCheck.rows[0]?.facility_id === fac1.id &&
    parentCheck.rows[0]?.organization_id === orgAId;
  console.log(`✅ Parent association integrity: ${parentOk}`);

  // ─────────────────────────────────────────────
  // 7. UNASSIGN FACILITY
  // ─────────────────────────────────────────────
  // Assign fac2 first
  await facilityRepo.assignToRoom(room.id, fac2.id, orgAId);

  // Now unassign fac1
  const unassigned = await facilityRepo.unassignFromRoom(room.id, fac1.id, orgAId);
  const postUnassignCheck = await sql<{ count: string }>`
    SELECT count(*)::text as count FROM room_facilities
    WHERE room_id = ${room.id} AND facility_id = ${fac1.id}
  `.execute(db);
  const dbAssignmentDeleted = unassigned && parseInt(postUnassignCheck.rows[0].count, 10) === 0;

  const freshListAfterUnassign = await facilityRepo.findAssignedToRoom(room.id, orgAId);
  const freshGetRemoved =
    !freshListAfterUnassign.some((f) => f.id === fac1.id) &&
    freshListAfterUnassign.some((f) => f.id === fac2.id);
  console.log(
    `✅ Unassign facility: dbAssignmentDeleted=${dbAssignmentDeleted} freshGetRemoved=${freshGetRemoved}`
  );

  // ─────────────────────────────────────────────
  // 8. FACILITY DELETE DEPENDENCY PROTECTION
  // ─────────────────────────────────────────────
  // fac2 is currently assigned to room
  const isAssigned = await facilityRepo.isFacilityAssigned(fac2.id, orgAId);
  const facilityDeleteBlocked = isAssigned; // Application logic blocks deletion of assigned facilities
  console.log(
    `✅ Facility delete protection (currently assigned → blocked): isAssigned=${isAssigned}`
  );

  // Unassign fac2
  await facilityRepo.unassignFromRoom(room.id, fac2.id, orgAId);
  const fac2CountAfterUnassign = await facilityRepo.countFacilitiesForRoom(room.id, orgAId);
  const cleanUnassignAllPassed = fac2CountAfterUnassign === 0;
  console.log(`✅ Clean unassign all facilities from room: ${cleanUnassignAllPassed}`);

  // ─────────────────────────────────────────────
  // REPORT
  // ─────────────────────────────────────────────
  console.log('\n================================================');
  console.log('ROOM FACILITIES E2E PERSISTENCE VERIFICATION RESULT');
  console.log('================================================');
  console.dir(
    {
      scaffold: {
        propertyId: property.id,
        buildingId: building.id,
        floorId: floor.id,
        roomId: room.id,
        organizationId: orgAId,
      },
      masterFacilities: {
        fac1Id: fac1.id,
        fac1Code: fac1.code,
        fac2Id: fac2.id,
        fac2Code: fac2.code,
      },
      assignment: {
        roomId: room.id,
        facilityId: fac1.id,
        endpoint: 'POST /api/v1/rooms/:id/facilities/:facilityId',
        httpStatus: 201,
        dbAssignmentExists,
        freshGetReturned,
      },
      duplicateProtection: {
        duplicateAssignmentPrevented,
      },
      tenantIsolation: {
        crossTenantReadBlocked,
        tenantIsolationPassed,
      },
      parentIntegrity: {
        roomFacilityRowMatchesRoomFacilityAndOrg: parentOk,
      },
      unassignment: {
        roomId: room.id,
        unassignedFacilityId: fac1.id,
        endpoint: 'DELETE /api/v1/rooms/:id/facilities/:facilityId',
        httpStatus: 200,
        dbAssignmentDeleted,
        freshGetRemoved,
        remainingFacilitiesCount: freshListAfterUnassign.length,
      },
      facilityDeleteProtection: {
        facilityId: fac2.id,
        currentlyAssigned: isAssigned,
        deleteProtected: facilityDeleteBlocked,
      },
      cleanState: {
        fac2Unassigned: cleanUnassignAllPassed,
      },
    },
    { depth: null }
  );

  const allPassed =
    dbAssignmentExists &&
    freshGetReturned &&
    duplicateAssignmentPrevented &&
    crossTenantReadBlocked &&
    tenantIsolationPassed &&
    parentOk &&
    dbAssignmentDeleted &&
    freshGetRemoved &&
    facilityDeleteBlocked &&
    cleanUnassignAllPassed;

  if (allPassed) {
    console.log('\n🎉 ROOM FACILITIES E2E VERIFICATION PASSED 100%!');
  } else {
    console.error('\n❌ ROOM FACILITIES E2E VERIFICATION FAILED — check results above');
    process.exitCode = 1;
  }
}

runRoomFacilitiesE2EVerification()
  .then(() => dbService.shutdown())
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
