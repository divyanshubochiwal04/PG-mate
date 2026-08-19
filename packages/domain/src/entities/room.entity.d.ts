import { AggregateRoot, type BaseEntityProps } from './base.entity';
export type RoomStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type RoomType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR_BED' | 'DORMITORY' | 'CUSTOM';
export interface RoomProps extends BaseEntityProps {
    floorId: string;
    buildingId: string;
    propertyId: string;
    organizationId: string;
    roomNumber: string;
    roomType: RoomType;
    capacity: number;
    displayOrder: number;
    status: RoomStatus;
}
export declare class RoomEntity extends AggregateRoot<RoomProps> {
    static create(props: RoomProps): RoomEntity;
    get floorId(): string;
    get buildingId(): string;
    get propertyId(): string;
    get organizationId(): string;
    get roomNumber(): string;
    get roomType(): RoomType;
    get capacity(): number;
    get displayOrder(): number;
    get status(): RoomStatus;
}
//# sourceMappingURL=room.entity.d.ts.map