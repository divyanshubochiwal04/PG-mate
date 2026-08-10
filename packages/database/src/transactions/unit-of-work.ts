import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import { logger } from '@m-square/logger';

export type TransactionWork<T> = (trx: Transaction<DatabaseSchema>) => Promise<T>;

export interface UnitOfWork {
  runInTransaction<T>(work: TransactionWork<T>): Promise<T>;
}

export class KyselyUnitOfWork implements UnitOfWork {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  /**
   * Executes callback within an isolated Kysely PostgreSQL transaction.
   * Automatically issues COMMIT on success and ROLLBACK on error.
   */
  public async runInTransaction<T>(work: TransactionWork<T>): Promise<T> {
    return this.db.transaction().execute(async (trx) => {
      try {
        const result = await work(trx);
        return result;
      } catch (err) {
        logger.warn('Transaction aborted due to error — performing ROLLBACK', {
          error: (err as Error).message,
        });
        throw err;
      }
    });
  }
}
