import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
export interface StayRow {
    id: string;
    organization_id: string;
    resident_id: string;
    admission_date: Date;
    expected_checkout_date: Date | null;
    actual_checkout_date: Date | null;
    status: string;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
}
export interface CreateStayData {
    residentId: string;
    admissionDate?: Date;
    expectedCheckoutDate?: Date | null;
    notes?: string | null;
    status?: string;
}
export declare class KyselyStayRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    private getExecutor;
    findByIdForOrganization(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<StayRow | null>;
    findByIdForUpdate(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<StayRow | null>;
    findActiveByResident(residentId: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<StayRow | null>;
    findAllByResident(residentId: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<StayRow[]>;
    createForOrganization(organizationId: string, data: CreateStayData, trx?: Transaction<DatabaseSchema>): Promise<StayRow>;
    completeStay(id: string, organizationId: string, actualCheckoutDate?: Date, notes?: string, trx?: Transaction<DatabaseSchema>): Promise<StayRow | null>;
    updateForOrganization(id: string, organizationId: string, data: {
        expectedCheckoutDate?: Date | null;
        notes?: string | null;
    }, trx?: Transaction<DatabaseSchema>): Promise<StayRow | null>;
    findActiveStaysByOrganization(organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<StayRow[]>;
}
//# sourceMappingURL=stay.repository.d.ts.map