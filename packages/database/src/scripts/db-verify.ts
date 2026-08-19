import { dbService } from '../connection/database';
import { MigrationService, REQUIRED_SCHEMA_TABLES } from '../migrations/migrator';
import { sql } from 'kysely';

async function run() {
  console.log('=== PHYSICAL POSTGRESQL SCHEMA VERIFICATION ===');
  try {
    const db = dbService.db;
    const migrationService = new MigrationService(db);
    const readiness = await migrationService.verifySchemaReadiness();

    const physicalTablesRes = await sql<{ table_name: string }>`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `.execute(db);

    const existingTables = new Set(physicalTablesRes.rows.map((r) => r.table_name));

    const modules = [
      {
        name: `M1-M6 Core (Auth, Tenant, Inventory, Allocation) [${REQUIRED_SCHEMA_TABLES.M1_TO_M6.length} tables]`,
        tables: REQUIRED_SCHEMA_TABLES.M1_TO_M6,
      },
      {
        name: `M7.1 Resident Commercial Management [${REQUIRED_SCHEMA_TABLES.M7_1.length} tables]`,
        tables: REQUIRED_SCHEMA_TABLES.M7_1,
      },
      {
        name: `M7.2 Mess Management [${REQUIRED_SCHEMA_TABLES.M7_2.length} tables]`,
        tables: REQUIRED_SCHEMA_TABLES.M7_2,
      },
      {
        name: `M7.3 Billing & Payments [${REQUIRED_SCHEMA_TABLES.M7_3.length} tables]`,
        tables: REQUIRED_SCHEMA_TABLES.M7_3,
      },
      {
        name: `M20 Notification Management [${REQUIRED_SCHEMA_TABLES.M20.length} tables]`,
        tables: REQUIRED_SCHEMA_TABLES.M20,
      },
      {
        name: `M21 Task Management [${REQUIRED_SCHEMA_TABLES.M21.length} tables]`,
        tables: REQUIRED_SCHEMA_TABLES.M21,
      },
      {
        name: `M22 Staff, Role & Scope Management [${REQUIRED_SCHEMA_TABLES.M22.length} tables]`,
        tables: REQUIRED_SCHEMA_TABLES.M22,
      },
    ];

    let overallSuccess = true;

    for (const mod of modules) {
      console.log(`\n--- ${mod.name} ---`);
      const matrix = mod.tables.map((tbl) => {
        const exists = existingTables.has(tbl);
        if (!exists) overallSuccess = false;
        return {
          table: tbl,
          status: exists ? '✅ EXISTS' : '❌ MISSING',
        };
      });
      console.table(matrix);
    }

    console.log(`\n📊 SCHEMA READINESS METRICS:`);
    console.log(`- Authoritative Application Tables Expected: ${readiness.expectedTableCount}`);
    console.log(
      `- Application Tables Present in PostgreSQL: ${readiness.expectedTableCount - readiness.missingTables.length}/${readiness.expectedTableCount}`
    );
    console.log(
      `- Total Physical Base Tables (including Kysely system tables): ${physicalTablesRes.rows.length}`
    );
    console.log(`- Missing Tables: ${readiness.missingTables.length}`);

    if (readiness.pendingMigrations.length > 0) {
      console.error('\n❌ PENDING MIGRATIONS DETECTED:', readiness.pendingMigrations);
      overallSuccess = false;
    }

    if (overallSuccess && readiness.isReady) {
      console.log(
        `\n✅ VERIFICATION PASSED: All ${readiness.expectedTableCount} application tables exist in PostgreSQL and migration history is 100% in sync.`
      );
      process.exitCode = 0;
    } else {
      console.error('\n❌ VERIFICATION FAILED: Database schema is incomplete or out of sync!');
      process.exitCode = 1;
    }
  } catch (err: any) {
    console.error('❌ Schema verification execution error:', err.message);
    process.exitCode = 1;
  } finally {
    await dbService.shutdown();
  }
}

run();
