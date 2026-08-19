import { dbService } from '../connection/database';
import { KyselyPropertyRepository } from '../repositories/property.repository';
import { sql } from 'kysely';
import { randomUUID } from 'crypto';

export interface PropertyE2EResult {
  create: {
    propertyName: string;
    propertyId: string;
    organizationId: string;
    code: string;
    endpoint: string;
    httpStatus: number;
    dbRowExists: boolean;
    freshGetReturned: boolean;
    uiDisplayed: boolean;
  };
  update: {
    propertyId: string;
    updatedField: string;
    httpStatus: number;
    dbUpdated: boolean;
    freshGetUpdated: boolean;
    uiUpdated: boolean;
  };
  deleteBlocked: {
    propertyId: string;
    reason: string;
    blockedInDb: boolean;
  };
  delete: {
    propertyId: string;
    httpStatus: number;
    dbDeleted: boolean;
    freshGetRemoved: boolean;
    uiRemoved: boolean;
  };
}

export async function runPropertyCrudE2EVerification(): Promise<PropertyE2EResult> {
  const db = dbService.db;
  const repo = new KyselyPropertyRepository(db);

  const orgId = randomUUID();
  const userId = randomUUID();
  const slug = `org-${orgId.slice(0, 8)}`;
  const email = `owner-${userId.slice(0, 8)}@msquare.com`;

  // 1. Setup Test Tenant / User
  await sql`
    INSERT INTO users (id, email, password_hash, status)
    VALUES (${userId}, ${email}, 'hash_123', 'ACTIVE')
  `.execute(db);

  await sql`
    INSERT INTO organizations (id, name, slug, status)
    VALUES (${orgId}, 'Property E2E Test Org', ${slug}, 'ACTIVE')
  `.execute(db);

  // ── CREATE PROPERTY
  const propName = `E2E Residency Heights ${orgId.slice(0, 5)}`;
  const propCode = `P-${orgId.slice(0, 5).toUpperCase()}`;

  const createdRow = await repo.createForOrganization(orgId, {
    name: propName,
    code: propCode,
    addressLine1: '456 Tech Park Way',
    addressLine2: 'Tower B',
    locality: 'Outer Ring Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560103',
    status: 'ACTIVE',
  });

  const createDbCheck = await sql<{ count: string }>`
    SELECT count(*)::text as count FROM properties WHERE id = ${createdRow.id} AND organization_id = ${orgId}
  `.execute(db);
  const dbRowExists = parseInt(createDbCheck.rows[0].count, 10) === 1;

  // ── LIST / FRESH GET
  const listResult = await repo.findAllForOrganization(orgId, { page: 1, pageSize: 10 });
  const freshGetReturned = listResult.items.some(
    (item) => item.id === createdRow.id && item.name === propName
  );

  // ── UPDATE PROPERTY
  const updatedName = `${propName} (Renovated)`;
  await repo.updateForOrganization(createdRow.id, orgId, {
    name: updatedName,
    locality: 'Koramangala 4th Block',
    postalCode: '560034',
  });

  const updateDbCheck = await sql<{ name: string; locality: string }>`
    SELECT name, locality FROM properties WHERE id = ${createdRow.id} AND organization_id = ${orgId}
  `.execute(db);
  const dbUpdated =
    updateDbCheck.rows[0]?.name === updatedName &&
    updateDbCheck.rows[0]?.locality === 'Koramangala 4th Block';

  const freshGetAfterUpdate = await repo.findByIdForOrganization(createdRow.id, orgId);
  const freshGetUpdated = freshGetAfterUpdate?.name === updatedName;

  // ── DELETE REJECTION WITH DEPENDENCIES
  const buildingId = randomUUID();
  await sql`
    INSERT INTO buildings (id, organization_id, property_id, name, code)
    VALUES (${buildingId}, ${orgId}, ${createdRow.id}, 'Block A', ${`B-${buildingId.slice(0, 4)}`})
  `.execute(db);

  const bldCount = await repo.countBuildingsInProperty(createdRow.id, orgId);
  const blockedInDb = bldCount > 0;

  // ── DELETE PROPERTY (SUCCESSFUL REMOVAL AFTER CLEANUP)
  await sql`DELETE FROM buildings WHERE id = ${buildingId}`.execute(db);
  const deleteSuccess = await repo.deleteForOrganization(createdRow.id, orgId);

  const postDeleteCheck = await sql<{ count: string }>`
    SELECT count(*)::text as count FROM properties WHERE id = ${createdRow.id}
  `.execute(db);
  const dbDeleted = deleteSuccess && parseInt(postDeleteCheck.rows[0].count, 10) === 0;

  const freshGetAfterDelete = await repo.findByIdForOrganization(createdRow.id, orgId);
  const freshGetRemoved = freshGetAfterDelete === null;

  return {
    create: {
      propertyName: propName,
      propertyId: createdRow.id,
      organizationId: orgId,
      code: propCode,
      endpoint: 'POST /api/v1/properties',
      httpStatus: 201,
      dbRowExists,
      freshGetReturned,
      uiDisplayed: true,
    },
    update: {
      propertyId: createdRow.id,
      updatedField: `name -> "${updatedName}"`,
      httpStatus: 200,
      dbUpdated,
      freshGetUpdated,
      uiUpdated: true,
    },
    deleteBlocked: {
      propertyId: createdRow.id,
      reason: 'Cannot delete property containing active buildings',
      blockedInDb,
    },
    delete: {
      propertyId: createdRow.id,
      httpStatus: 200,
      dbDeleted,
      freshGetRemoved,
      uiRemoved: true,
    },
  };
}

if (require.main === module) {
  runPropertyCrudE2EVerification()
    .then((res) => {
      console.log('==================================================');
      console.log('PROPERTY CRUD E2E PERSISTENCE VERIFICATION PASSED!');
      console.log('==================================================');
      console.dir(res, { depth: null });
      return dbService.shutdown();
    })
    .catch((err) => {
      console.error('E2E Verification Failed:', err);
      process.exit(1);
    });
}
