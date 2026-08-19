import { AggregateRoot, type BaseEntityProps } from './base.entity';
export type FacilityCategory = 'GENERAL' | 'UTILITY' | 'SAFETY' | 'COMFORT';
export type FacilityStatus = 'ACTIVE' | 'INACTIVE';
export interface FacilityProps extends BaseEntityProps {
    organizationId: string;
    name: string;
    code: string;
    category: FacilityCategory;
    description?: string | null;
    status: FacilityStatus;
}
export declare class FacilityEntity extends AggregateRoot<FacilityProps> {
    static create(props: FacilityProps): FacilityEntity;
    get organizationId(): string;
    get name(): string;
    get code(): string;
    get category(): FacilityCategory;
    get description(): string | null | undefined;
    get status(): FacilityStatus;
}
//# sourceMappingURL=facility.entity.d.ts.map