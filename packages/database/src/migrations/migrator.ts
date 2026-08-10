import { type Kysely, Migrator, NO_MIGRATIONS } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import { logger } from '@m-square/logger';

export class MigrationService {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  /**
   * Executes all pending `up` migrations in deterministic order.
   * Recommended for production and CI/CD pipelines.
   */
  public async migrateToLatest(): Promise<void> {
    const migrator = new Migrator({
      db: this.db,
      provider: {
        getMigrations: async () => ({}), // Foundation migration provider placeholder
      },
    });

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
    const migrator = new Migrator({
      db: this.db,
      provider: {
        getMigrations: async () => ({}),
      },
    });

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
    const migrator = new Migrator({
      db: this.db,
      provider: {
        getMigrations: async () => ({}),
      },
    });

    await migrator.migrateTo(NO_MIGRATIONS);
  }
}
