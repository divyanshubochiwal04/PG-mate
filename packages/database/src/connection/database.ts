import { Kysely, PostgresDialect, sql } from 'kysely';
import type { Pool } from 'pg';
import { closePgPool, createPgPool } from './pool';
import { logger } from '@m-square/logger';
import type { DatabaseSchema } from '../schema/combined.schema';

export type { DatabaseSchema };

export class DatabaseService {
  private kyselyInstance: Kysely<DatabaseSchema> | null = null;
  private poolInstance: Pool | null = null;

  public get db(): Kysely<DatabaseSchema> {
    if (!this.kyselyInstance) {
      this.init();
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.kyselyInstance!;
  }

  public init(customPool?: Pool): void {
    this.poolInstance = customPool ?? createPgPool();
    this.kyselyInstance = new Kysely<DatabaseSchema>({
      dialect: new PostgresDialect({
        pool: this.poolInstance,
      }),
    });
  }

  /**
   * Lightweight health check query performing `SELECT 1`.
   * Returns true if database connection is active and responsive.
   */
  public async checkHealth(): Promise<boolean> {
    try {
      const result = await sql<{ res: number }>`SELECT 1 as res`.execute(this.db);
      return result.rows.length > 0 && result.rows[0].res === 1;
    } catch (err) {
      logger.error('Database health check failed', { error: (err as Error).message });
      return false;
    }
  }

  public async shutdown(): Promise<void> {
    if (this.kyselyInstance) {
      await this.kyselyInstance.destroy();
      this.kyselyInstance = null;
    }
    await closePgPool();
  }
}

export const dbService = new DatabaseService();
