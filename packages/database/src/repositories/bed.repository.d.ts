import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { PaginatedResult, PaginationParams } from '@m-square/contracts';
export interface BedRow {
    id: string;
    room_id: string;
    organization_id: string;
    bed_number: string;
    display_order: number;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface CreateBedData {
    roomId: string;
    bedNumber: string;
    displayOrder?: number;
    status?: string;
}
export interface UpdateBedData {
    bedNumber?: string;
    displayOrder?: number;
    status?: string;
}
export declare class KyselyBedRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    private getExecutor;
    findByIdForOrganization(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<BedRow | null>;
    findByIdForUpdate(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<BedRow | null>;
    findAllByRoom(roomId: string, organizationId: string, params: PaginationParams): Promise<PaginatedResult<BedRow>>;
    /**
     * Count active beds in room (AVAILABLE or MAINTENANCE).
     * Used in capacity calculations under room FOR UPDATE lock.
     */
    countActiveBedsInRoom(roomId: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<number>;
    createForOrganization(organizationId: string, data: CreateBedData, trx?: Transaction<DatabaseSchema>): Promise<BedRow>;
    updateStatus(id: string, organizationId: string, status: string, trx?: Transaction<DatabaseSchema>): Promise<BedRow | null>;
    updateForOrganization(id: string, organizationId: string, data: UpdateBedData, trx?: Transaction<DatabaseSchema>): Promise<BedRow | null>;
    deleteForOrganization(id: string, organizationId: string): Promise<boolean>;
}
//# sourceMappingURL=bed.repository.d.ts.map