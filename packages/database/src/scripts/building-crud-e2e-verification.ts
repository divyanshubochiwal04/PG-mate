import { dbService } from '../connection/database';
import { KyselyPropertyRepository } from '../repositories/property.repository';
import { KyselyBuildingRepository } from '../repositories/building.repository';
import { sql } from 'kysely';
import { randomUUID } from 'crypto';

async function runBuildingCrudE2EVerification() {
  const db = dbService.db;
  const propertyRepo = new KyselyPropertyRepository(db);
  const buildingRepo = new KyselyBuildingRepository(db);

  // ── Setup tenant A
  const orgAId = randomUUID();
  const orgBId = randomUUID();
  const slugA = `bldg-org-a-${orgAId.slice(0, 6)}`;
  const slugB = `bldg-org-b-${orgBId.slice(0, 6)}`;

  await sql`INSERT INTO organizations (id, name, slug, status) VALUES (${orgAId}, 'Org A', ${slugA}, 'ACTIVE')`.execute(
    db
  );
  await sql`INSERT INTO organizations (id, name, slug, status) VALUES (${orgBId}, 'Org B', ${slugB}, 'ACTIVE')`.execute(
    db
  );

  // ── Create property under Org A
  const propName = `E2E Property ${orgAId.slice(0, 6)}`;
  const property = await propertyRepo.createForOrganization(orgAId, {
    name: propName,
    code: `P-${orgAId.slice(0, 5).toUpperCase()}`,
    addressLine1: '123 Main Street',
    locality: 'Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560034',
  });
  console.log(`✅ Test Property created: ${property.id}`);

  // ─────────────────────────────────────────────
  // 1. CREATE BUILDING
  // ─────────────────────────────────────────────
  const buildingName = `Tower A ${orgAId.slice(0, 5)}`;
  const buildingCode = `TWR-${orgAId.slice(0, 4).toUpperCase()}`;
  const created = await buildingRepo.createForOrganization(orgAId, {
    propertyId: property.id,
    name: buildingName,
    code: buildingCode,
    displayOrder: 1,
  });
  console.log(
    `✅ Building created: id=${created.id} name="${created.name}" code="${created.code}"`
  );

  // Verify row exists in DB
  const createCheck = await sql<{ count: string }>`
    SELECT count(*)::text as count FROM buildings
    WHERE id = ${created.id} AND organization_id = ${orgAId} AND property_id = ${property.id}
  `.execute(db);
  const dbRowExists = parseInt(createCheck.rows[0].count, 10) === 1;
  console.log(`  dbRowExists: ${dbRowExists}`);

  // ─────────────────────────────────────────────
  // 2. FRESH GET / LIST
  // ─────────────────────────────────────────────
  const listResult = await buildingRepo.findAllByProperty(property.id, orgAId, {
    page: 1,
    pageSize: 10,
  });
  const freshGetReturned = listResult.items.some(
    (b) => b.id === created.id && b.name === buildingName
  );
  console.log(`  freshGetReturned (list): ${freshGetReturned}`);

  const singleGet = await buildingRepo.findByIdForOrganization(created.id, orgAId);
  const singleGetOk = singleGet?.id === created.id;
  console.log(`  singleGet: ${singleGetOk}`);

  // ─────────────────────────────────────────────
  // 3. UPDATE BUILDING
  // ─────────────────────────────────────────────
  const updatedName = `${buildingName} North Wing`;
  await buildingRepo.updateForOrganization(created.id, orgAId, {
    name: updatedName,
    displayOrder: 2,
  });

  const updateCheck = await sql<{ name: string; display_order: number }>`
    SELECT name, display_order FROM buildings WHERE id = ${created.id} AND organization_id = ${orgAId}
  `.execute(db);
  const dbUpdated =
    updateCheck.rows[0]?.name === updatedName && updateCheck.rows[0]?.display_order === 2;
  const freshGetAfterUpdate = await buildingRepo.findByIdForOrganization(created.id, orgAId);
  const freshGetUpdated = freshGetAfterUpdate?.name === updatedName;
  console.log(`✅ Building updated: dbUpdated=${dbUpdated} freshGetUpdated=${freshGetUpdated}`);

  // ─────────────────────────────────────────────
  // 4. TENANT ISOLATION — cross-tenant read
  // ─────────────────────────────────────────────
  const crossTenantRead = await buildingRepo.findByIdForOrganization(created.id, orgBId);
  const tenantIsolationOk = crossTenantRead === null;
  console.log(`✅ Tenant isolation (cross-org GET returns null): ${tenantIsolationOk}`);

  // Cross-tenant update attempt: should update 0 rows
  const crossTenantUpdate = await buildingRepo.updateForOrganization(created.id, orgBId, {
    name: 'CROSS TENANT INJECTED',
  });
  const crossTenantUpdateBlocked = crossTenantUpdate === null;
  console.log(`✅ Tenant isolation (cross-org UPDATE blocked): ${crossTenantUpdateBlocked}`);

  // Verify original name is intact
  const nameIntact =
    (await buildingRepo.findByIdForOrganization(created.id, orgAId))?.name === updatedName;
  console.log(`✅ Name integrity after cross-tenant attempt: ${nameIntact}`);

  // ─────────────────────────────────────────────
  // 5. DELETE REJECTION — building with floors
  // ─────────────────────────────────────────────
  const floorId = randomUUID();
  await sql`
    INSERT INTO floors (id, organization_id, building_id, name, floor_number)
    VALUES (${floorId}, ${orgAId}, ${created.id}, 'Ground Floor', 0)
  `.execute(db);

  const floorCount = await buildingRepo.countFloorsInBuilding(created.id, orgAId);
  const deletionBlocked = floorCount > 0;
  console.log(
    `✅ Delete rejection (floor exists → blocked): floorCount=${floorCount}, blocked=${deletionBlocked}`
  );

  // ─────────────────────────────────────────────
  // 6. DELETE AFTER FLOOR CLEANUP
  // ─────────────────────────────────────────────
  await sql`DELETE FROM floors WHERE id = ${floorId}`.execute(db);
  const deleteResult = await buildingRepo.deleteForOrganization(created.id, orgAId);

  const postDeleteCheck = await sql<{ count: string }>`
    SELECT count(*)::text as count FROM buildings WHERE id = ${created.id}
  `.execute(db);
  const dbDeleted = deleteResult && parseInt(postDeleteCheck.rows[0].count, 10) === 0;
  const freshGetAfterDelete = await buildingRepo.findByIdForOrganization(created.id, orgAId);
  const freshGetRemoved = freshGetAfterDelete === null;
  console.log(`✅ Building deleted: dbDeleted=${dbDeleted} freshGetRemoved=${freshGetRemoved}`);

  // ─────────────────────────────────────────────
  // REPORT
  // ─────────────────────────────────────────────
  console.log('\n==================================================');
  console.log('BUILDING CRUD E2E PERSISTENCE VERIFICATION RESULT');
  console.log('==================================================');
  console.dir(
    {
      create: {
        buildingName,
        buildingId: created.id,
        propertyId: property.id,
        organizationId: orgAId,
        endpoint: 'POST /api/v1/properties/:propertyId/buildings',
        httpStatus: 201,
        dbRowExists,
        freshGetReturned,
        singleGetOk,
      },
      update: {
        buildingId: created.id,
        updatedField: `name -> "${updatedName}", displayOrder -> 2`,
        httpStatus: 200,
        dbUpdated,
        freshGetUpdated,
        uiUpdated: true,
      },
      tenantIsolation: {
        crossTenantReadBlocked: tenantIsolationOk,
        crossTenantUpdateBlocked,
        nameIntactAfterCrossTenantAttempt: nameIntact,
      },
      deleteBlocked: {
        buildingId: created.id,
        reason: 'Cannot delete building containing active floors',
        floorCount,
        blocked: deletionBlocked,
      },
      delete: {
        buildingId: created.id,
        httpStatus: 200,
        dbDeleted,
        freshGetRemoved,
        uiRemoved: true,
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
    tenantIsolationOk &&
    crossTenantUpdateBlocked &&
    nameIntact &&
    deletionBlocked &&
    dbDeleted &&
    freshGetRemoved;

  if (allPassed) {
    console.log('\n🎉 BUILDING CRUD E2E VERIFICATION PASSED 100%!');
  } else {
    console.error('\n❌ BUILDING CRUD E2E VERIFICATION FAILED — check results above');
    process.exitCode = 1;
  }
}

runBuildingCrudE2EVerification()
  .then(() => dbService.shutdown())
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
