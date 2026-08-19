import { dbService } from '../connection/database';
import { MigrationService } from '../migrations/migrator';

async function run() {
  console.log('🚀 Running canonical PostgreSQL database migrations...');
  try {
    const migrationService = new MigrationService(dbService.db);
    await migrationService.migrateToLatest();

    const readiness = await migrationService.verifySchemaReadiness();
    if (readiness.isReady) {
      console.log('✅ All migrations executed successfully and schema is 100% READY!');
    } else {
      console.error(
        '❌ Schema verification failed after migration! Missing tables:',
        readiness.missingTables
      );
      process.exitCode = 1;
    }
  } catch (err: any) {
    console.error('❌ Database migration failed loudly:', err.message);
    process.exitCode = 1;
  } finally {
    await dbService.shutdown();
  }
}

run();
