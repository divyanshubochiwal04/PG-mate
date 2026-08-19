import { AggregateRoot, type BaseEntityProps } from './base.entity';
export type BedStatus = 'AVAILABLE' | 'INACTIVE' | 'MAINTENANCE';
export interface BedProps extends BaseEntityProps {
    roomId: string;
    organizationId: string;
    bedNumber: string;
    displayOrder: number;
    status: BedStatus;
}
export declare class BedEntity extends AggregateRoot<BedProps> {
    static create(props: BedProps): BedEntity;
    get roomId(): string;
    get organizationId(): string;
    get bedNumber(): string;
    get displayOrder(): number;
    get status(): BedStatus;
    /**
     * Capacity Rule: AVAILABLE and MAINTENANCE beds occupy room capacity.
     * INACTIVE beds do NOT occupy room capacity.
     */
    countsTowardCapacity(): boolean;
}
//# sourceMappingURL=bed.entity.d.ts.map