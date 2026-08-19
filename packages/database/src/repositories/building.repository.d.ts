import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { PaginatedResult, PaginationParams } from '@m-square/contracts';
export interface BuildingRow {
    id: string;
    property_id: string;
    organization_id: string;
    name: string;
    code: string;
    display_order: number;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface CreateBuildingData {
    propertyId: string;
    name: string;
    code: string;
    displayOrder?: number;
    status?: string;
}
export interface UpdateBuildingData {
    name?: string;
    code?: string;
    displayOrder?: number;
    status?: string;
}
export declare class KyselyBuildingRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    private getExecutor;
    findByIdForOrganization(id: string, organizationId: string): Promise<BuildingRow | null>;
    findAllByProperty(propertyId: string, organizationId: string, params: PaginationParams): Promise<PaginatedResult<BuildingRow>>;
    createForOrganization(organizationId: string, data: CreateBuildingData, trx?: Transaction<DatabaseSchema>): Promise<BuildingRow>;
    updateForOrganization(id: string, organizationId: string, data: UpdateBuildingData): Promise<BuildingRow | null>;
    deleteForOrganization(id: string, organizationId: string): Promise<boolean>;
    countFloorsInBuilding(buildingId: string, organizationId: string): Promise<number>;
}
//# sourceMappingURL=building.repository.d.ts.map