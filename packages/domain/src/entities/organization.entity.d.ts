import { AggregateRoot, type BaseEntityProps } from './base.entity';
export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
export interface OrganizationProps extends BaseEntityProps {
    name: string;
    slug: string;
    status: OrganizationStatus;
}
export declare class OrganizationEntity extends AggregateRoot<OrganizationProps> {
    static create(props: OrganizationProps): OrganizationEntity;
    get name(): string;
    get slug(): string;
    get status(): OrganizationStatus;
    isActive(): boolean;
}
//# sourceMappingURL=organization.entity.d.ts.map