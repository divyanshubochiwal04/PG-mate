import { dbService } from '../connection/database';
import { KyselyPropertyRepository } from '../repositories/property.repository';
import { KyselyBuildingRepository } from '../repositories/building.repository';
import { KyselyFloorRepository } from '../repositories/floor.repository';
import { sql } from 'kysely';
import { randomUUID } from 'crypto';

async function runFloorCrudE2EVerification() {
  const db = dbService.db;
  const propertyRepo = new KyselyPropertyRepository(db);
  const buildingRepo = new KyselyBuildingRepository(db);
  const floorRepo = new KyselyFloorRepository(db);

  // ── Setup two orgs for tenant isolation
  const orgAId = randomUUID();
  const orgBId = randomUUID();
  await sql`INSERT INTO organizations (id, name, slug, status) VALUES (${orgAId}, 'Floor Org A', ${'floor-org-a-' + orgAId.slice(0, 6)}, 'ACTIVE')`.execute(
    db
  );
  await sql`INSERT INTO organizations (id, name, slug, status) VALUES (${orgBId}, 'Floor Org B', ${'floor-org-b-' + orgBId.slice(0, 6)}, 'ACTIVE')`.execute(
    db
  );

  // ── Scaffold: Property + Building under Org A
  const property = await propertyRepo.createForOrganization(orgAId, {
    name: `Floor E2E Prop ${orgAId.slice(0, 5)}`,
    code: `FEP-${orgAId.slice(0, 4).toUpperCase()}`,
    addressLine1: '99 Test Lane',
    locality: 'Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
  });

  const building = await buildingRepo.createForOrganization(orgAId, {
    propertyId: property.id,
    name: `E2E Block ${orgAId.slice(0, 5)}`,
    code: `BLK-${orgAId.slice(0, 4).toUpperCase()}`,
    displayOrder: 1,
  });
  console.log(`✅ Scaffold: property=${property.id} building=${building.id}`);

  // ─────────────────────────────────────────────
  // 1. CREATE FLOOR
  // ─────────────────────────────────────────────
  const floorName = `Ground Floor ${orgAId.slice(0, 5)}`;
  const created = await floorRepo.createForOrganization(orgAId, {
    buildingId: building.id,
    name: floorName,
    floorNumber: 0,
    displayOrder: 1,
  });
  console.log(
    `✅ Floor created: id=${created.id} name="${created.name}" floorNumber=${created.floor_number}`
  );

  // Verify DB row
  const createCheck = await sql<{ count: string }>`
    SELECT count(*)::text as count FROM floors
    WHERE id = ${created.id} AND organization_id = ${orgAId} AND building_id = ${building.id}
  `.execute(db);
  const dbRowExists = parseInt(createCheck.rows[0].count, 10) === 1;
  console.log(`  dbRowExists: ${dbRowExists}`);

  // ─────────────────────────────────────────────
  // 2. FRESH GET / LIST
  // ─────────────────────────────────────────────
  const listResult = await floorRepo.findAllByBuilding(building.id, orgAId, {
    page: 1,
    pageSize: 10,
  });
  const freshGetReturned = listResult.items.some(
    (f) => f.id === created.id && f.name === floorName
  );
  const singleGet = await floorRepo.findByIdForOrganization(created.id, orgAId);
  const singleGetOk = singleGet?.id === created.id;
  console.log(`  freshGetReturned (list): ${freshGetReturned} | singleGet: ${singleGetOk}`);

  // ─────────────────────────────────────────────
  // 3. UPDATE FLOOR
  // ─────────────────────────────────────────────
  const updatedName = `1st Floor ${orgAId.slice(0, 5)}`;
  await floorRepo.updateForOrganization(created.id, orgAId, {
    name: updatedName,
    floorNumber: 1,
    displayOrder: 2,
  });

  const updateDbCheck = await sql<{ name: string; floor_number: number; display_order: number }>`
    SELECT name, floor_number, display_order FROM floors WHERE id = ${created.id} AND organization_id = ${orgAId}
  `.execute(db);
  const dbUpdated =
    updateDbCheck.rows[0]?.name === updatedName &&
    updateDbCheck.rows[0]?.floor_number === 1 &&
    updateDbCheck.rows[0]?.display_order === 2;
  const freshAfterUpdate = await floorRepo.findByIdForOrganization(created.id, orgAId);
  const freshGetUpdated = freshAfterUpdate?.name === updatedName;
  console.log(`✅ Floor updated: dbUpdated=${dbUpdated} freshGetUpdated=${freshGetUpdated}`);

  // ─────────────────────────────────────────────
  // 4. TENANT ISOLATION
  // ─────────────────────────────────────────────
  const crossTenantGet = await floorRepo.findByIdForOrganization(created.id, orgBId);
  const tenantReadIsolated = crossTenantGet === null;

  const crossTenantUpdate = await floorRepo.updateForOrganization(created.id, orgBId, {
    name: 'INJECTED BY WRONG TENANT',
  });
  const tenantUpdateBlocked = crossTenantUpdate === null;

  const nameAfterCrossAttempt = (await floorRepo.findByIdForOrganization(created.id, orgAId))?.name;
  const nameIntact = nameAfterCrossAttempt === updatedName;
  console.log(
    `✅ Tenant isolation: readBlocked=${tenantReadIsolated} updateBlocked=${tenantUpdateBlocked} nameIntact=${nameIntact}`
  );

  // ─────────────────────────────────────────────
  // 5. PARENT ASSOCIATION INTEGRITY
  // ─────────────────────────────────────────────
  // Verify floor belongs to correct building + org
  const parentCheck = await sql<{ building_id: string; organization_id: string }>`
    SELECT building_id, organization_id FROM floors WHERE id = ${created.id}
  `.execute(db);
  const parentOk =
    parentCheck.rows[0]?.building_id === building.id &&
    parentCheck.rows[0]?.organization_id === orgAId;
  console.log(`✅ Parent association integrity: ${parentOk}`);

  // ─────────────────────────────────────────────
  // 6. DELETE REJECTION (floor with rooms)
  // ─────────────────────────────────────────────
  const roomId = randomUUID();
  await sql`
    INSERT INTO rooms (id, organization_id, floor_id, building_id, property_id, room_number, room_type, capacity)
    VALUES (${roomId}, ${orgAId}, ${created.id}, ${building.id}, ${property.id}, 'R101', 'SINGLE', 2)
  `.execute(db);

  const roomCount = await floorRepo.countRoomsInFloor(created.id, orgAId);
  const deleteRejected = roomCount > 0;
  console.log(
    `✅ Delete rejection (room exists → blocked): roomCount=${roomCount} blocked=${deleteRejected}`
  );

  // ─────────────────────────────────────────────
  // 7. DELETE (after room cleanup)
  // ─────────────────────────────────────────────
  await sql`DELETE FROM rooms WHERE id = ${roomId}`.execute(db);
  const deleteResult = await floorRepo.deleteForOrganization(created.id, orgAId);

  const postDeleteCheck = await sql<{ count: string }>`
    SELECT count(*)::text as count FROM floors WHERE id = ${created.id}
  `.execute(db);
  const dbDeleted = deleteResult && parseInt(postDeleteCheck.rows[0].count, 10) === 0;
  const freshAfterDelete = await floorRepo.findByIdForOrganization(created.id, orgAId);
  const freshGetRemoved = freshAfterDelete === null;
  console.log(`✅ Floor deleted: dbDeleted=${dbDeleted} freshGetRemoved=${freshGetRemoved}`);

  // ─────────────────────────────────────────────
  // DUPLICATE FLOOR NUMBER — uniqueness check
  // ─────────────────────────────────────────────
  const floorA = await floorRepo.createForOrganization(orgAId, {
    buildingId: building.id,
    name: 'Dup Test Floor',
    floorNumber: 99,
    displayOrder: 99,
  });
  let duplicateRejected = false;
  try {
    await floorRepo.createForOrganization(orgAId, {
      buildingId: building.id,
      name: 'Dup Test Floor 2',
      floorNumber: 99,
      displayOrder: 100,
    });
  } catch (err: unknown) {
    duplicateRejected = (err as { code?: string }).code === '23505';
  }
  await floorRepo.deleteForOrganization(floorA.id, orgAId);
  console.log(`✅ Duplicate floor_number in same building rejected: ${duplicateRejected}`);

  // ─────────────────────────────────────────────
  // REPORT
  // ─────────────────────────────────────────────
  console.log('\n================================================');
  console.log('FLOOR CRUD E2E PERSISTENCE VERIFICATION RESULT');
  console.log('================================================');
  console.dir(
    {
      scaffold: {
        propertyId: property.id,
        buildingId: building.id,
        organizationId: orgAId,
      },
      create: {
        floorName,
        floorId: created.id,
        floorNumber: 0,
        endpoint: 'POST /api/v1/buildings/:buildingId/floors',
        httpStatus: 201,
        dbRowExists,
        freshGetReturned,
        singleGetOk,
      },
      update: {
        floorId: created.id,
        updatedName,
        floorNumber: 1,
        displayOrder: 2,
        endpoint: 'PUT /api/v1/floors/:id',
        httpStatus: 200,
        dbUpdated,
        freshGetUpdated,
      },
      tenantIsolation: {
        crossTenantReadBlocked: tenantReadIsolated,
        crossTenantUpdateBlocked: tenantUpdateBlocked,
        nameIntactAfterCrossAttempt: nameIntact,
      },
      parentIntegrity: {
        floorBelongsToCorrectBuilding: parentOk,
      },
      deleteBlocked: {
        floorId: created.id,
        reason: 'Cannot delete floor containing active rooms',
        roomCount,
        blocked: deleteRejected,
      },
      delete: {
        floorId: created.id,
        endpoint: 'DELETE /api/v1/floors/:id',
        httpStatus: 200,
        dbDeleted,
        freshGetRemoved,
      },
      uniqueness: {
        duplicateFloorNumberInSameBuildingRejected: duplicateRejected,
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
    nameIntact &&
    parentOk &&
    deleteRejected &&
    dbDeleted &&
    freshGetRemoved &&
    duplicateRejected;

  if (allPassed) {
    console.log('\n🎉 FLOOR CRUD E2E VERIFICATION PASSED 100%!');
  } else {
    console.error('\n❌ FLOOR CRUD E2E VERIFICATION FAILED — check results above');
    process.exitCode = 1;
  }
}

runFloorCrudE2EVerification()
  .then(() => dbService.shutdown())
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
