import { type Kysely } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { ExpenseReportResponseDto, PropertyPerformanceReportDto, ReportFilterDto } from '@m-square/contracts';
export declare class KyselyFinancialReportingRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    getExpenseReport(organizationId: string, filter: ReportFilterDto): Promise<ExpenseReportResponseDto>;
    getPropertyPerformanceReport(organizationId: string, filter: ReportFilterDto): Promise<PropertyPerformanceReportDto>;
}
//# sourceMappingURL=reporting-financial.repository.d.ts.map