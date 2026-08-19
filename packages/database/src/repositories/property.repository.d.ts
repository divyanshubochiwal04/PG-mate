import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { PaginatedResult, PaginationParams } from '@m-square/contracts';
export interface PropertyRow {
    id: string;
    organization_id: string;
    name: string;
    code: string;
    address_line1: string;
    address_line2: string | null;
    locality: string;
    city: string;
    state: string;
    postal_code: string;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface CreatePropertyData {
    name: string;
    code: string;
    addressLine1: string;
    addressLine2?: string | null;
    locality: string;
    city: string;
    state: string;
    postalCode: string;
    status?: string;
}
export interface UpdatePropertyData {
    name?: string;
    code?: string;
    addressLine1?: string;
    addressLine2?: string | null;
    locality?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    status?: string;
}
export declare class KyselyPropertyRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    findByIdForOrganization(id: string, organizationId: string): Promise<PropertyRow | null>;
    findAllForOrganization(organizationId: string, params: PaginationParams, search?: string, status?: string): Promise<PaginatedResult<PropertyRow>>;
    createForOrganization(organizationId: string, data: CreatePropertyData): Promise<PropertyRow>;
    updateForOrganization(id: string, organizationId: string, data: UpdatePropertyData): Promise<PropertyRow | null>;
    deleteForOrganization(id: string, organizationId: string): Promise<boolean>;
    countBuildingsInProperty(propertyId: string, organizationId: string): Promise<number>;
}
//# sourceMappingURL=property.repository.d.ts.map