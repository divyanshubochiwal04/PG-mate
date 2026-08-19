import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { BuildingOccupancyTreeDto, PaginatedResult, PaginationParams } from '@m-square/contracts';
export interface RoomRow {
    id: string;
    floor_id: string;
    building_id: string;
    property_id: string;
    organization_id: string;
    room_number: string;
    room_type: string;
    capacity: number;
    display_order: number;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface CreateRoomData {
    floorId: string;
    buildingId: string;
    propertyId: string;
    roomNumber: string;
    roomType?: string;
    capacity: number;
    displayOrder?: number;
    status?: string;
}
export interface UpdateRoomData {
    roomNumber?: string;
    roomType?: string;
    displayOrder?: number;
    status?: string;
}
export declare class KyselyRoomRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    private getExecutor;
    findByIdForOrganization(id: string, organizationId: string): Promise<RoomRow | null>;
    /**
     * Acquire a FOR UPDATE row lock on the room row for serializing capacity operations.
     */
    findByIdForUpdate(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<RoomRow | null>;
    findAllByFloor(floorId: string, organizationId: string, params: PaginationParams): Promise<PaginatedResult<RoomRow>>;
    createForOrganization(organizationId: string, data: CreateRoomData, trx?: Transaction<DatabaseSchema>): Promise<RoomRow>;
    updateForOrganization(id: string, organizationId: string, data: UpdateRoomData): Promise<RoomRow | null>;
    updateCapacity(id: string, organizationId: string, newCapacity: number, trx?: Transaction<DatabaseSchema>): Promise<RoomRow | null>;
    deleteForOrganization(id: string, organizationId: string): Promise<boolean>;
    countBedsInRoom(roomId: string, organizationId: string): Promise<number>;
    findBuildingOccupancyTree(buildingId: string, organizationId: string): Promise<BuildingOccupancyTreeDto | null>;
}
//# sourceMappingURL=room.repository.d.ts.map