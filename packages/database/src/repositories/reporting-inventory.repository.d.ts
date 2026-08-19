import { type Kysely } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { InventoryReportResponseDto, ProcurementReportResponseDto, ReportFilterDto } from '@m-square/contracts';
export declare class KyselyInventoryReportingRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    getInventoryReport(organizationId: string, filter: ReportFilterDto): Promise<InventoryReportResponseDto>;
    getProcurementReport(organizationId: string, filter: ReportFilterDto): Promise<ProcurementReportResponseDto>;
}
//# sourceMappingURL=reporting-inventory.repository.d.ts.map