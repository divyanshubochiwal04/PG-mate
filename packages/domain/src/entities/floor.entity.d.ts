import { AggregateRoot, type BaseEntityProps } from './base.entity';
export type FloorStatus = 'ACTIVE' | 'INACTIVE';
export interface FloorProps extends BaseEntityProps {
    buildingId: string;
    organizationId: string;
    name: string;
    floorNumber: number;
    displayOrder: number;
    status: FloorStatus;
}
export declare class FloorEntity extends AggregateRoot<FloorProps> {
    static create(props: FloorProps): FloorEntity;
    get buildingId(): string;
    get organizationId(): string;
    get name(): string;
    get floorNumber(): number;
    get displayOrder(): number;
    get status(): FloorStatus;
}
//# sourceMappingURL=floor.entity.d.ts.map