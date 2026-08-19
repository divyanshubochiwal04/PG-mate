import { type Kysely } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { BillingReportResponseDto, CollectionReportResponseDto, OutstandingReportResponseDto, ReportFilterDto } from '@m-square/contracts';
export declare class KyselyBillingReportingRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    getBillingReport(organizationId: string, filter: ReportFilterDto): Promise<BillingReportResponseDto>;
    getCollectionReport(organizationId: string, filter: ReportFilterDto): Promise<CollectionReportResponseDto>;
    getOutstandingReport(organizationId: string, filter: ReportFilterDto): Promise<OutstandingReportResponseDto>;
}
//# sourceMappingURL=reporting-billing.repository.d.ts.map