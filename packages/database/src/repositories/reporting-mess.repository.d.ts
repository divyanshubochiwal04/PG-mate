import { type Kysely } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { MessReportResponseDto, ReportFilterDto } from '@m-square/contracts';
export declare class KyselyMessReportingRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    getMessReport(organizationId: string, filter: ReportFilterDto): Promise<MessReportResponseDto>;
}
//# sourceMappingURL=reporting-mess.repository.d.ts.map