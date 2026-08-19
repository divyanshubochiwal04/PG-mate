import { type Kysely } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { ActivityQueryResultItem, BillingQueryResult, ExpenseQueryResult, MessQueryResult, OccupancyQueryResult, OperationalAlertQueryResultItem, ResidentQueryResult } from './reporting-query-types';
export * from './reporting-query-types';
export declare class KyselyReportingRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    getOccupancyMetrics(organizationId: string, propertyId?: string, buildingId?: string): Promise<OccupancyQueryResult>;
    getResidentMetrics(organizationId: string, propertyId?: string, buildingId?: string, startDate?: string, endDate?: string): Promise<ResidentQueryResult>;
    getBillingMetrics(organizationId: string, propertyId?: string, buildingId?: string, startDate?: string, endDate?: string): Promise<BillingQueryResult>;
    getMessMetrics(organizationId: string, propertyId?: string, buildingId?: string, startDate?: string, endDate?: string): Promise<MessQueryResult>;
    getExpenseMetrics(organizationId: string, propertyId?: string, buildingId?: string, startDate?: string, endDate?: string): Promise<ExpenseQueryResult>;
    getRecentActivity(organizationId: string, propertyId?: string, buildingId?: string, limit?: number): Promise<ActivityQueryResultItem[]>;
    getOperationalAlerts(organizationId: string, propertyId?: string, buildingId?: string): Promise<OperationalAlertQueryResultItem[]>;
}
//# sourceMappingURL=reporting.repository.d.ts.map