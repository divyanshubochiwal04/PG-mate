import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { PaginatedResult, PaginationParams } from '@m-square/contracts';
export interface FacilityRow {
    id: string;
    organization_id: string;
    name: string;
    code: string;
    category: string;
    description: string | null;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface CreateFacilityData {
    name: string;
    code: string;
    category?: string;
    description?: string | null;
    status?: string;
}
export interface UpdateFacilityData {
    name?: string;
    code?: string;
    category?: string;
    description?: string | null;
    status?: string;
}
export declare class KyselyFacilityRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    private getExecutor;
    findByIdForOrganization(id: string, organizationId: string): Promise<FacilityRow | null>;
    findAllForOrganization(organizationId: string, params: PaginationParams): Promise<PaginatedResult<FacilityRow>>;
    createForOrganization(organizationId: string, data: CreateFacilityData): Promise<FacilityRow>;
    updateForOrganization(id: string, organizationId: string, data: UpdateFacilityData): Promise<FacilityRow | null>;
    assignToProperty(propertyId: string, facilityId: string, organizationId: string): Promise<boolean>;
    unassignFromProperty(propertyId: string, facilityId: string, organizationId: string): Promise<boolean>;
    assignToBuilding(buildingId: string, facilityId: string, organizationId: string): Promise<boolean>;
    unassignFromBuilding(buildingId: string, facilityId: string, organizationId: string): Promise<boolean>;
    assignToRoom(roomId: string, facilityId: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<boolean>;
    unassignFromRoom(roomId: string, facilityId: string, organizationId: string): Promise<boolean>;
    findAssignedToRoom(roomId: string, organizationId: string): Promise<FacilityRow[]>;
    isFacilityAssigned(facilityId: string, organizationId: string): Promise<boolean>;
    countFacilitiesForRoom(roomId: string, organizationId: string): Promise<number>;
}
//# sourceMappingURL=facility.repository.d.ts.map