import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
export interface EmergencyContactRow {
    id: string;
    resident_id: string;
    organization_id: string;
    name: string;
    relationship: string;
    phone: string;
    alternate_phone: string | null;
    is_primary: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface CreateEmergencyContactData {
    residentId: string;
    name: string;
    relationship: string;
    phone: string;
    alternatePhone?: string | null;
    isPrimary?: boolean;
}
export interface UpdateEmergencyContactData {
    name?: string;
    relationship?: string;
    phone?: string;
    alternatePhone?: string | null;
    isPrimary?: boolean;
}
export declare class KyselyEmergencyContactRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    private getExecutor;
    findByIdForOrganization(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<EmergencyContactRow | null>;
    findAllByResident(residentId: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<EmergencyContactRow[]>;
    findPrimaryByResident(residentId: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<EmergencyContactRow | null>;
    unsetPrimaryForResident(residentId: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<void>;
    createForResident(organizationId: string, data: CreateEmergencyContactData, trx?: Transaction<DatabaseSchema>): Promise<EmergencyContactRow>;
    updateForResident(id: string, organizationId: string, data: UpdateEmergencyContactData, trx?: Transaction<DatabaseSchema>): Promise<EmergencyContactRow | null>;
    deleteForResident(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<boolean>;
}
//# sourceMappingURL=emergency-contact.repository.d.ts.map