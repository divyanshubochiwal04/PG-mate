import { AggregateRoot, type BaseEntityProps } from './base.entity';
import { BusinessRuleValidationError } from '../errors/domain.error';

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

export class FacilityEntity extends AggregateRoot<FacilityProps> {
  public static create(props: FacilityProps): FacilityEntity {
    if (!props.name || props.name.trim().length === 0) {
      throw new BusinessRuleValidationError('Facility name cannot be empty');
    }
    if (!props.code || props.code.trim().length === 0) {
      throw new BusinessRuleValidationError('Facility code cannot be empty');
    }

    return new FacilityEntity({
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

  get category(): FacilityCategory {
    return this.props.category;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get status(): FacilityStatus {
    return this.props.status;
  }
}
