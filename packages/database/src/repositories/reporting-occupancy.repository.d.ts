import { type Kysely } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { OccupancyReportResponseDto, ReportFilterDto } from '@m-square/contracts';
export declare class KyselyOccupancyReportingRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    getOccupancyReport(organizationId: string, filter: ReportFilterDto): Promise<OccupancyReportResponseDto>;
}
//# sourceMappingURL=reporting-occupancy.repository.d.ts.map