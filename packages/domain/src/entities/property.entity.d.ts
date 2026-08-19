import { AggregateRoot, type BaseEntityProps } from './base.entity';
export type PropertyStatus = 'ACTIVE' | 'INACTIVE';
export interface PropertyAddress {
    addressLine1: string;
    addressLine2?: string | null;
    locality: string;
    city: string;
    state: string;
    postalCode: string;
}
export interface PropertyProps extends BaseEntityProps {
    organizationId: string;
    name: string;
    code: string;
    address: PropertyAddress;
    status: PropertyStatus;
}
export declare class PropertyEntity extends AggregateRoot<PropertyProps> {
    static create(props: PropertyProps): PropertyEntity;
    get organizationId(): string;
    get name(): string;
    get code(): string;
    get address(): PropertyAddress;
    get status(): PropertyStatus;
    isActive(): boolean;
}
//# sourceMappingURL=property.entity.d.ts.map