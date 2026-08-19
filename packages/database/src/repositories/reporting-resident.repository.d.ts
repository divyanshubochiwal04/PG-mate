import { type Kysely } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { ReportFilterDto, ResidentReportResponseDto } from '@m-square/contracts';
export declare class KyselyResidentReportingRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    getResidentReport(organizationId: string, filter: ReportFilterDto): Promise<ResidentReportResponseDto>;
}
//# sourceMappingURL=reporting-resident.repository.d.ts.map