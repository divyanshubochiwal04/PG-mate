import { Kysely } from 'kysely';
import type { Pool } from 'pg';
import type { DatabaseSchema } from '../schema/combined.schema';
export type { DatabaseSchema };
export declare class DatabaseService {
    private kyselyInstance;
    private poolInstance;
    get db(): Kysely<DatabaseSchema>;
    init(customPool?: Pool): void;
    /**
     * Lightweight health check query performing `SELECT 1`.
     * Returns true if database connection is active and responsive.
     */
    checkHealth(): Promise<boolean>;
    shutdown(): Promise<void>;
}
export declare const dbService: DatabaseService;
//# sourceMappingURL=database.d.ts.map