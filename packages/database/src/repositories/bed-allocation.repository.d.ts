import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
export interface BedAllocationRow {
    id: string;
    organization_id: string;
    stay_id: string;
    bed_id: string;
    start_at: Date;
    end_at: Date | null;
    status: string;
    created_at: Date;
    updated_at: Date;
}
export interface CreateAllocationData {
    stayId: string;
    bedId: string;
    startAt?: Date;
    status?: string;
}
export interface DetailedCurrentLocation {
    propertyId: string;
    propertyName: string;
    buildingId: string;
    buildingName: string;
    floorId: string;
    floorName: string;
    roomId: string;
    roomNumber: string;
    bedId: string;
    bedNumber: string;
    allocationId: string;
    stayId: string;
}
export declare class KyselyBedAllocationRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    private getExecutor;
    findByIdForOrganization(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<BedAllocationRow | null>;
    findByIdForUpdate(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<BedAllocationRow | null>;
    findActiveByBed(bedId: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<BedAllocationRow | null>;
    findActiveByStay(stayId: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<BedAllocationRow | null>;
    findAllByStay(stayId: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<BedAllocationRow[]>;
    findCurrentLocationForResident(residentId: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<DetailedCurrentLocation | null>;
    createForOrganization(organizationId: string, data: CreateAllocationData, trx?: Transaction<DatabaseSchema>): Promise<BedAllocationRow>;
    endAllocation(id: string, organizationId: string, endAt?: Date, trx?: Transaction<DatabaseSchema>): Promise<BedAllocationRow | null>;
}
//# sourceMappingURL=bed-allocation.repository.d.ts.map