import { dbService } from '../connection/database';
import { MigrationService } from '../migrations/migrator';

async function run() {
  console.log('=== POSTGRESQL MIGRATION STATUS ===');
  try {
    const migrationService = new MigrationService(dbService.db);
    const statusList = await migrationService.getMigrationStatus();
    console.table(statusList);
  } catch (err: any) {
    console.error('❌ Failed to fetch migration status:', err.message);
    process.exitCode = 1;
  } finally {
    await dbService.shutdown();
  }
}

run();
