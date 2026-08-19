import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { PaginatedResult, PaginationParams } from '@m-square/contracts';
export interface ResidentRow {
    id: string;
    organization_id: string;
    resident_code: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    preferred_name: string | null;
    date_of_birth: Date | null;
    gender: string;
    phone: string;
    alternate_phone: string | null;
    email: string | null;
    address_line1: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface CreateResidentData {
    residentCode: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    preferredName?: string | null;
    dateOfBirth?: Date | null;
    gender: string;
    phone: string;
    alternatePhone?: string | null;
    email?: string | null;
    addressLine1?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    status?: string;
}
export interface UpdateResidentData {
    firstName?: string;
    middleName?: string | null;
    lastName?: string;
    preferredName?: string | null;
    dateOfBirth?: Date | null;
    gender?: string;
    phone?: string;
    alternatePhone?: string | null;
    email?: string | null;
    addressLine1?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    status?: string;
}
import type { ResidentOperationalListResponseDto, ResidentOperationalQueryPayload, ResidentOperationalSummaryDto } from '@m-square/contracts';
export declare class KyselyResidentRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    private getExecutor;
    findByIdForOrganization(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<ResidentRow | null>;
    findByIdForUpdate(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<ResidentRow | null>;
    findAllForOrganization(organizationId: string, params: PaginationParams, search?: string, status?: string): Promise<PaginatedResult<ResidentRow>>;
    findOperationalList(organizationId: string, params: ResidentOperationalQueryPayload): Promise<ResidentOperationalListResponseDto>;
    getOperationalSummary(organizationId: string): Promise<ResidentOperationalSummaryDto>;
    createForOrganization(organizationId: string, data: CreateResidentData, trx?: Transaction<DatabaseSchema>): Promise<ResidentRow>;
    updateForOrganization(id: string, organizationId: string, data: UpdateResidentData, trx?: Transaction<DatabaseSchema>): Promise<ResidentRow | null>;
}
//# sourceMappingURL=resident.repository.d.ts.map