import { AggregateRoot, type BaseEntityProps } from './base.entity';
import { BusinessRuleValidationError } from '../errors/domain.error';

export type FloorStatus = 'ACTIVE' | 'INACTIVE';

export interface FloorProps extends BaseEntityProps {
  buildingId: string;
  organizationId: string;
  name: string;
  floorNumber: number;
  displayOrder: number;
  status: FloorStatus;
}

export class FloorEntity extends AggregateRoot<FloorProps> {
  public static create(props: FloorProps): FloorEntity {
    if (!props.name || props.name.trim().length === 0) {
      throw new BusinessRuleValidationError('Floor name cannot be empty');
    }

    return new FloorEntity({
      ...props,
      name: props.name.trim(),
    });
  }

  get buildingId(): string {
    return this.props.buildingId;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get name(): string {
    return this.props.name;
  }

  get floorNumber(): number {
    return this.props.floorNumber;
  }

  get displayOrder(): number {
    return this.props.displayOrder;
  }

  get status(): FloorStatus {
    return this.props.status;
  }
}
