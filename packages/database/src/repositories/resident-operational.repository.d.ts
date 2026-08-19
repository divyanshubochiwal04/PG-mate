import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { ResidentOperationalListResponseDto, ResidentOperationalQueryPayload, ResidentOperationalSummaryDto } from '@m-square/contracts';
export declare class KyselyResidentOperationalRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    findOperationalList(organizationId: string, params: ResidentOperationalQueryPayload): Promise<ResidentOperationalListResponseDto>;
    getOperationalSummary(organizationId: string): Promise<ResidentOperationalSummaryDto>;
}
//# sourceMappingURL=resident-operational.repository.d.ts.map