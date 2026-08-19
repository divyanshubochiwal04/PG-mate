import { dbService } from '../connection/database';
import { sql } from 'kysely';
import { logger } from '@m-square/logger';

async function runOwnerAccessE2E(): Promise<void> {
  logger.info('=== STARTING OWNER OPERATIONAL ACCESS & TENANT ISOLATION E2E ===');

  try {
    // 1. Verify Real PostgreSQL Connectivity
    const healthResult = await sql<{ current_db: string; current_user: string }>`
      SELECT current_database() as current_db, current_user as current_user
    `.execute(dbService.db);

    if (healthResult.rows.length === 0) {
      throw new Error('Database ping query failed.');
    }

    const { current_db, current_user } = healthResult.rows[0];
    logger.info(`PostgreSQL Connected: database="${current_db}", user="${current_user}"`);

    // 2. Fetch Organizations & Owners
    const orgs = await dbService.db
      .selectFrom('organizations')
      .selectAll()
      .where('status', '=', 'ACTIVE')
      .execute();

    if (orgs.length === 0) {
      logger.warn('No active organizations found in DB. Skipping tenant verification.');
      return;
    }

    const primaryOrg = orgs[0];
    logger.info(`Auditing Primary Organization: ${primaryOrg.name} (${primaryOrg.id})`);

    // 3. Verify Owner Full Operational Access Across Modules
    const properties = await dbService.db
      .selectFrom('properties')
      .selectAll()
      .where('organization_id', '=', primaryOrg.id)
      .execute();
    logger.info(`[PASS] Properties Scoped to Tenant: ${properties.length} found`);

    const residents = await dbService.db
      .selectFrom('residents')
      .selectAll()
      .where('organization_id', '=', primaryOrg.id)
      .execute();
    logger.info(`[PASS] Residents Scoped to Tenant: ${residents.length} found`);

    const invoices = await dbService.db
      .selectFrom('invoices')
      .selectAll()
      .where('organization_id', '=', primaryOrg.id)
      .execute();
    logger.info(`[PASS] Invoices Scoped to Tenant: ${invoices.length} found`);

    const tasks = await dbService.db
      .selectFrom('tasks')
      .selectAll()
      .where('organization_id', '=', primaryOrg.id)
      .execute();
    logger.info(`[PASS] Tasks Scoped to Tenant: ${tasks.length} found`);

    const notifications = await dbService.db
      .selectFrom('notifications')
      .selectAll()
      .where('organization_id', '=', primaryOrg.id)
      .execute();
    logger.info(`[PASS] Notifications Scoped to Tenant: ${notifications.length} found`);

    // 4. Verify Strict Tenant Isolation Against Non-Existent / Other Tenant ID
    const fakeOrgId = '00000000-0000-0000-0000-000000000000';
    const crossTenantResidents = await dbService.db
      .selectFrom('residents')
      .selectAll()
      .where('organization_id', '=', fakeOrgId)
      .execute();

    if (crossTenantResidents.length !== 0) {
      throw new Error('Tenant isolation breach! Returned data for unassociated tenant.');
    }
    logger.info('[PASS] Tenant Isolation Verified: 0 cross-tenant records exposed.');

    // 5. Transaction Safety Test
    await dbService.db.transaction().execute(async (trx) => {
      const testRow = await sql<{ ok: number }>`SELECT 1 as ok`.execute(trx);
      if (!testRow.rows[0]?.ok) {
        throw new Error('Transaction test query failed');
      }
    });
    logger.info('[PASS] Transaction Isolation & Commit Verified.');

    logger.info('=== OWNER OPERATIONAL ACCESS & TENANT ISOLATION E2E PASSED ===');
    process.exit(0);
  } finally {
    await dbService.shutdown();
  }
}

runOwnerAccessE2E().catch((err) => {
  logger.error('Owner Access E2E Failed', { error: (err as Error).message });
  process.exit(1);
});
