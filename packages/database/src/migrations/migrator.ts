import { type Kysely, Migrator, NO_MIGRATIONS } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import { logger } from '@m-square/logger';
import * as m00001 from './00001_auth_schema';

export class MigrationService {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private getMigrator(): Migrator {
    return new Migrator({
      db: this.db,
      provider: {
        getMigrations: async () => ({
          '00001_auth_schema': m00001,
        }),
      },
    });
  }

  /**
   * Executes all pending `up` migrations in deterministic order.
   * Recommended for production and CI/CD pipelines.
   */
  public async migrateToLatest(): Promise<void> {
    const migrator = this.getMigrator();
    const { error, results } = await migrator.migrateToLatest();

    results?.forEach((it) => {
      if (it.status === 'Success') {
        logger.info(`Migration '${it.migrationName}' executed successfully`);
      } else if (it.status === 'Error') {
        logger.error(`Migration '${it.migrationName}' failed`);
      }
    });

    if (error) {
      logger.error('Migration execution failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Development-only rollback of the last migration step.
   * NEVER use in production environments (production policy is forward-only).
   */
  public async rollbackDevelopmentStep(): Promise<void> {
    const migrator = this.getMigrator();
    const { error, results } = await migrator.migrateDown();

    results?.forEach((it) => {
      logger.info(`Development rollback '${it.migrationName}' executed`);
    });

    if (error) {
      logger.error('Development rollback failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Reverts all migrations (testing environment reset only).
   */
  public async resetTestDatabase(): Promise<void> {
    const migrator = this.getMigrator();
    await migrator.migrateTo(NO_MIGRATIONS);
  }
}
