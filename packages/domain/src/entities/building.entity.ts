import { AggregateRoot, type BaseEntityProps } from './base.entity';
import { BusinessRuleValidationError } from '../errors/domain.error';

export type BuildingStatus = 'ACTIVE' | 'INACTIVE';

export interface BuildingProps extends BaseEntityProps {
  propertyId: string;
  organizationId: string;
  name: string;
  code: string;
  displayOrder: number;
  status: BuildingStatus;
}

export class BuildingEntity extends AggregateRoot<BuildingProps> {
  public static create(props: BuildingProps): BuildingEntity {
    if (!props.name || props.name.trim().length === 0) {
      throw new BusinessRuleValidationError('Building name cannot be empty');
    }
    if (!props.code || props.code.trim().length === 0) {
      throw new BusinessRuleValidationError('Building code cannot be empty');
    }

    return new BuildingEntity({
      ...props,
      name: props.name.trim(),
      code: props.code.trim().toUpperCase(),
    });
  }

  get propertyId(): string {
    return this.props.propertyId;
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

  get displayOrder(): number {
    return this.props.displayOrder;
  }

  get status(): BuildingStatus {
    return this.props.status;
  }
}
