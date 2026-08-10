import { AggregateRoot, type BaseEntityProps } from './base.entity';
import { BusinessRuleValidationError } from '../errors/domain.error';

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

export class PropertyEntity extends AggregateRoot<PropertyProps> {
  public static create(props: PropertyProps): PropertyEntity {
    if (!props.name || props.name.trim().length === 0) {
      throw new BusinessRuleValidationError('Property name cannot be empty');
    }
    if (!props.code || props.code.trim().length === 0) {
      throw new BusinessRuleValidationError('Property code cannot be empty');
    }
    if (!props.address.addressLine1 || props.address.addressLine1.trim().length === 0) {
      throw new BusinessRuleValidationError('Address line 1 cannot be empty');
    }
    if (!props.address.locality || props.address.locality.trim().length === 0) {
      throw new BusinessRuleValidationError('Locality cannot be empty');
    }
    if (!props.address.city || props.address.city.trim().length === 0) {
      throw new BusinessRuleValidationError('City cannot be empty');
    }
    if (!props.address.state || props.address.state.trim().length === 0) {
      throw new BusinessRuleValidationError('State cannot be empty');
    }
    if (!props.address.postalCode || props.address.postalCode.trim().length === 0) {
      throw new BusinessRuleValidationError('Postal code cannot be empty');
    }

    return new PropertyEntity({
      ...props,
      name: props.name.trim(),
      code: props.code.trim().toUpperCase(),
    });
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get name(): string {
    return this.props.name;
  }

  get code(): string {
    return this.props.code;
  }

  get address(): PropertyAddress {
    return this.props.address;
  }

  get status(): PropertyStatus {
    return this.props.status;
  }

  public isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }
}
