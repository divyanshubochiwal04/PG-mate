import { AggregateRoot, type BaseEntityProps } from './base.entity';

export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

export interface OrganizationProps extends BaseEntityProps {
  name: string;
  slug: string;
  status: OrganizationStatus;
}

export class OrganizationEntity extends AggregateRoot<OrganizationProps> {
  public static create(props: OrganizationProps): OrganizationEntity {
    return new OrganizationEntity(props);
  }

  public get name(): string {
    return this.props.name;
  }

  public get slug(): string {
    return this.props.slug;
  }

  public get status(): OrganizationStatus {
    return this.props.status;
  }

  public isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }
}
