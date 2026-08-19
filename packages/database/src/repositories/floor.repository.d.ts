import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { PaginatedResult, PaginationParams } from '@m-square/contracts';
export interface FloorRow {
    id: string;
    building_id: string;
    organization_id: string;
    name: string;
    floor_number: number;
    display_order: number;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface CreateFloorData {
    buildingId: string;
    name: string;
    floorNumber: number;
    displayOrder?: number;
    status?: string;
}
export interface UpdateFloorData {
    name?: string;
    floorNumber?: number;
    displayOrder?: number;
    status?: string;
}
export declare class KyselyFloorRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    private getExecutor;
    findByIdForOrganization(id: string, organizationId: string): Promise<FloorRow | null>;
    findAllByBuilding(buildingId: string, organizationId: string, params: PaginationParams): Promise<PaginatedResult<FloorRow>>;
    createForOrganization(organizationId: string, data: CreateFloorData, trx?: Transaction<DatabaseSchema>): Promise<FloorRow>;
    updateForOrganization(id: string, organizationId: string, data: UpdateFloorData): Promise<FloorRow | null>;
    deleteForOrganization(id: string, organizationId: string): Promise<boolean>;
    countRoomsInFloor(floorId: string, organizationId: string): Promise<number>;
}
//# sourceMappingURL=floor.repository.d.ts.map