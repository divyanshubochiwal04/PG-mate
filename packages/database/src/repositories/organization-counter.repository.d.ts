import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
export declare class KyselyOrganizationCounterRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    private getExecutor;
    getNextValueForUpdate(organizationId: string, counterType: string, trx?: Transaction<DatabaseSchema>): Promise<number>;
}
//# sourceMappingURL=organization-counter.repository.d.ts.map