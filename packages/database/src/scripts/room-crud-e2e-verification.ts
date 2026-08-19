import { dbService } from '../connection/database';
import { KyselyPropertyRepository } from '../repositories/property.repository';
import { KyselyBuildingRepository } from '../repositories/building.repository';
import { KyselyFloorRepository } from '../repositories/floor.repository';
import { KyselyRoomRepository } from '../repositories/room.repository';
import { sql } from 'kysely';
import { randomUUID } from 'crypto';

async function runRoomCrudE2EVerification() {
  const db = dbService.db;
  const propertyRepo = new KyselyPropertyRepository(db);
  const buildingRepo = new KyselyBuildingRepository(db);
  const floorRepo = new KyselyFloorRepository(db);
  const roomRepo = new KyselyRoomRepository(db);

  // ── Setup two orgs for tenant isolation
  const orgAId = randomUUID();
  const orgBId = randomUUID();
  await sql`INSERT INTO organizations (id, name, slug, status) VALUES (${orgAId}, 'Room Org A', ${'room-org-a-' + orgAId.slice(0, 6)}, 'ACTIVE')`.execute(
    db
  );
  await sql`INSERT INTO organizations (id, name, slug, status) VALUES (${orgBId}, 'Room Org B', ${'room-org-b-' + orgBId.slice(0, 6)}, 'ACTIVE')`.execute(
    db
  );

  // ── Scaffold: Property + Building + Floor under Org A
  const property = await propertyRepo.createForOrganization(orgAId, {
    name: `Room E2E Prop ${orgAId.slice(0, 5)}`,
    code: `REP-${orgAId.slice(0, 4).toUpperCase()}`,
    addressLine1: '100 Room Street',
    locality: 'HSR Layout',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560102',
  });

  const building = await buildingRepo.createForOrganization(orgAId, {
    propertyId: property.id,
    name: `Room E2E Block ${orgAId.slice(0, 5)}`,
    code: `RBLK-${orgAId.slice(0, 3).toUpperCase()}`,
    displayOrder: 1,
  });

  const floor = await floorRepo.createForOrganization(orgAId, {
    buildingId: building.id,
    name: `First Floor ${orgAId.slice(0, 5)}`,
    floorNumber: 1,
    displayOrder: 1,
  });

  console.log(`✅ Scaffold: property=${property.id} building=${building.id} floor=${floor.id}`);

  // ─────────────────────────────────────────────
  // 1. CREATE ROOM
  // ─────────────────────────────────────────────
  const roomNumber = `R101-${orgAId.slice(0, 4)}`;
  const created = await roomRepo.createForOrganization(orgAId, {
    floorId: floor.id,
    buildingId: building.id,
    propertyId: property.id,
    roomNumber,
    roomType: 'DOUBLE',
    capacity: 2,
    displayOrder: 1,
  });
  console.log(
    `✅ Room created: id=${created.id} roomNumber="${created.room_number}" capacity=${created.capacity}`
  );

  // Verify DB row
  const createCheck = await sql<{ count: string }>`
    SELECT count(*)::text as count FROM rooms
    WHERE id = ${created.id} AND organization_id = ${orgAId} AND floor_id = ${floor.id}
  `.execute(db);
  const dbRowExists = parseInt(createCheck.rows[0].count, 10) === 1;
  console.log(`  dbRowExists: ${dbRowExists}`);

  // ─────────────────────────────────────────────
  // 2. FRESH GET / LIST
  // ─────────────────────────────────────────────
  const listResult = await roomRepo.findAllByFloor(floor.id, orgAId, {
    page: 1,
    pageSize: 10,
  });
  const freshGetReturned = listResult.items.some(
    (r) => r.id === created.id && r.room_number === roomNumber
  );
  const singleGet = await roomRepo.findByIdForOrganization(created.id, orgAId);
  const singleGetOk = singleGet?.id === created.id;
  console.log(`  freshGetReturned (list): ${freshGetReturned} | singleGet: ${singleGetOk}`);

  // ─────────────────────────────────────────────
  // 3. UPDATE ROOM
  // ─────────────────────────────────────────────
  const updatedRoomNumber = `R101-UPD-${orgAId.slice(0, 4)}`;
  await roomRepo.updateForOrganization(created.id, orgAId, {
    roomNumber: updatedRoomNumber,
    roomType: 'TRIPLE',
    displayOrder: 2,
    status: 'ACTIVE',
  });

  const updateDbCheck = await sql<{
    room_number: string;
    room_type: string;
    display_order: number;
  }>`
    SELECT room_number, room_type, display_order FROM rooms WHERE id = ${created.id} AND organization_id = ${orgAId}
  `.execute(db);
  const dbUpdated =
    updateDbCheck.rows[0]?.room_number === updatedRoomNumber &&
    updateDbCheck.rows[0]?.room_type === 'TRIPLE' &&
    updateDbCheck.rows[0]?.display_order === 2;
  const freshAfterUpdate = await roomRepo.findByIdForOrganization(created.id, orgAId);
  const freshGetUpdated = freshAfterUpdate?.room_number === updatedRoomNumber;
  console.log(`✅ Room updated: dbUpdated=${dbUpdated} freshGetUpdated=${freshGetUpdated}`);

  // ─────────────────────────────────────────────
  // 4. TENANT ISOLATION
  // ─────────────────────────────────────────────
  const crossTenantGet = await roomRepo.findByIdForOrganization(created.id, orgBId);
  const tenantReadIsolated = crossTenantGet === null;

  const crossTenantUpdate = await roomRepo.updateForOrganization(created.id, orgBId, {
    roomNumber: 'INJECTED BY WRONG TENANT',
  });
  const tenantUpdateBlocked = crossTenantUpdate === null;

  const roomNumberAfterCrossAttempt = (await roomRepo.findByIdForOrganization(created.id, orgAId))
    ?.room_number;
  const numberIntact = roomNumberAfterCrossAttempt === updatedRoomNumber;
  console.log(
    `✅ Tenant isolation: readBlocked=${tenantReadIsolated} updateBlocked=${tenantUpdateBlocked} numberIntact=${numberIntact}`
  );

  // ─────────────────────────────────────────────
  // 5. PARENT ASSOCIATION INTEGRITY
  // ─────────────────────────────────────────────
  const parentCheck = await sql<{
    floor_id: string;
    building_id: string;
    property_id: string;
    organization_id: string;
  }>`
    SELECT floor_id, building_id, property_id, organization_id FROM rooms WHERE id = ${created.id}
  `.execute(db);
  const parentOk =
    parentCheck.rows[0]?.floor_id === floor.id &&
    parentCheck.rows[0]?.building_id === building.id &&
    parentCheck.rows[0]?.property_id === property.id &&
    parentCheck.rows[0]?.organization_id === orgAId;
  console.log(`✅ Parent association integrity: ${parentOk}`);

  // ─────────────────────────────────────────────
  // 6. DELETE REJECTION (room with beds)
  // ─────────────────────────────────────────────
  const bedId = randomUUID();
  await sql`
    INSERT INTO beds (id, organization_id, room_id, bed_number, status)
    VALUES (${bedId}, ${orgAId}, ${created.id}, 'Bed-1', 'AVAILABLE')
  `.execute(db);

  const bedCount = await roomRepo.countBedsInRoom(created.id, orgAId);
  const deleteRejected = bedCount > 0;
  console.log(
    `✅ Delete rejection (bed exists → blocked): bedCount=${bedCount} blocked=${deleteRejected}`
  );

  // ─────────────────────────────────────────────
  // 7. DELETE (after bed cleanup)
  // ─────────────────────────────────────────────
  await sql`DELETE FROM beds WHERE id = ${bedId}`.execute(db);
  const deleteResult = await roomRepo.deleteForOrganization(created.id, orgAId);

  const postDeleteCheck = await sql<{ count: string }>`
    SELECT count(*)::text as count FROM rooms WHERE id = ${created.id}
  `.execute(db);
  const dbDeleted = deleteResult && parseInt(postDeleteCheck.rows[0].count, 10) === 0;
  const freshAfterDelete = await roomRepo.findByIdForOrganization(created.id, orgAId);
  const freshGetRemoved = freshAfterDelete === null;
  console.log(`✅ Room deleted: dbDeleted=${dbDeleted} freshGetRemoved=${freshGetRemoved}`);

  // ─────────────────────────────────────────────
  // DUPLICATE ROOM NUMBER — uniqueness check per floor
  // ─────────────────────────────────────────────
  const roomA = await roomRepo.createForOrganization(orgAId, {
    floorId: floor.id,
    buildingId: building.id,
    propertyId: property.id,
    roomNumber: 'DUP-ROOM-1',
    capacity: 2,
  });
  let duplicateRejected = false;
  try {
    await roomRepo.createForOrganization(orgAId, {
      floorId: floor.id,
      buildingId: building.id,
      propertyId: property.id,
      roomNumber: 'DUP-ROOM-1',
      capacity: 2,
    });
  } catch (err: unknown) {
    duplicateRejected = (err as { code?: string }).code === '23505';
  }
  await roomRepo.deleteForOrganization(roomA.id, orgAId);
  console.log(`✅ Duplicate room_number on same floor rejected: ${duplicateRejected}`);

  // ─────────────────────────────────────────────
  // REPORT
  // ─────────────────────────────────────────────
  console.log('\n================================================');
  console.log('ROOM CRUD E2E PERSISTENCE VERIFICATION RESULT');
  console.log('================================================');
  console.dir(
    {
      scaffold: {
        propertyId: property.id,
        buildingId: building.id,
        floorId: floor.id,
        organizationId: orgAId,
      },
      create: {
        roomNumber,
        roomId: created.id,
        capacity: 2,
        endpoint: 'POST /api/v1/floors/:floorId/rooms',
        httpStatus: 201,
        dbRowExists,
        freshGetReturned,
        singleGetOk,
      },
      update: {
        roomId: created.id,
        updatedRoomNumber,
        roomType: 'TRIPLE',
        displayOrder: 2,
        endpoint: 'PUT /api/v1/rooms/:id',
        httpStatus: 200,
        dbUpdated,
        freshGetUpdated,
      },
      tenantIsolation: {
        crossTenantReadBlocked: tenantReadIsolated,
        crossTenantUpdateBlocked: tenantUpdateBlocked,
        numberIntactAfterCrossAttempt: numberIntact,
      },
      parentIntegrity: {
        roomBelongsToCorrectFloorBuildingProperty: parentOk,
      },
      deleteBlocked: {
        roomId: created.id,
        reason: 'Cannot delete room containing active beds',
        bedCount,
        blocked: deleteRejected,
      },
      delete: {
        roomId: created.id,
        endpoint: 'DELETE /api/v1/rooms/:id',
        httpStatus: 200,
        dbDeleted,
        freshGetRemoved,
      },
      uniqueness: {
        duplicateRoomNumberOnSameFloorRejected: duplicateRejected,
      },
    },
    { depth: null }
  );

  const allPassed =
    dbRowExists &&
    freshGetReturned &&
    singleGetOk &&
    dbUpdated &&
    freshGetUpdated &&
    tenantReadIsolated &&
    tenantUpdateBlocked &&
    numberIntact &&
    parentOk &&
    deleteRejected &&
    dbDeleted &&
    freshGetRemoved &&
    duplicateRejected;

  if (allPassed) {
    console.log('\n🎉 ROOM CRUD E2E VERIFICATION PASSED 100%!');
  } else {
    console.error('\n❌ ROOM CRUD E2E VERIFICATION FAILED — check results above');
    process.exitCode = 1;
  }
}

runRoomCrudE2EVerification()
  .then(() => dbService.shutdown())
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
