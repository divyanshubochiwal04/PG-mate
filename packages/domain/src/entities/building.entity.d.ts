import { AggregateRoot, type BaseEntityProps } from './base.entity';
export type BuildingStatus = 'ACTIVE' | 'INACTIVE';
export interface BuildingProps extends BaseEntityProps {
    propertyId: string;
    organizationId: string;
    name: string;
    code: string;
    displayOrder: number;
    status: BuildingStatus;
}
export declare class BuildingEntity extends AggregateRoot<BuildingProps> {
    static create(props: BuildingProps): BuildingEntity;
    get propertyId(): string;
    get organizationId(): string;
    get name(): string;
    get code(): string;
    get displayOrder(): number;
    get status(): BuildingStatus;
}
//# sourceMappingURL=building.entity.d.ts.map