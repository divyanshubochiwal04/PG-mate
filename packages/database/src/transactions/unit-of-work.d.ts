import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
export type TransactionWork<T> = (trx: Transaction<DatabaseSchema>) => Promise<T>;
export interface UnitOfWork {
    runInTransaction<T>(work: TransactionWork<T>): Promise<T>;
}
export declare class KyselyUnitOfWork implements UnitOfWork {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    /**
     * Executes callback within an isolated Kysely PostgreSQL transaction.
     * Automatically issues COMMIT on success and ROLLBACK on error.
     */
    runInTransaction<T>(work: TransactionWork<T>): Promise<T>;
}
//# sourceMappingURL=unit-of-work.d.ts.map