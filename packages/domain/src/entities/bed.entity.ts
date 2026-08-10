import { AggregateRoot, type BaseEntityProps } from './base.entity';
import { BusinessRuleValidationError } from '../errors/domain.error';

export type BedStatus = 'AVAILABLE' | 'INACTIVE' | 'MAINTENANCE';

export interface BedProps extends BaseEntityProps {
  roomId: string;
  organizationId: string;
  bedNumber: string;
  displayOrder: number;
  status: BedStatus;
}

export class BedEntity extends AggregateRoot<BedProps> {
  public static create(props: BedProps): BedEntity {
    if (!props.bedNumber || props.bedNumber.trim().length === 0) {
      throw new BusinessRuleValidationError('Bed number/label cannot be empty');
    }

    return new BedEntity({
      ...props,
      bedNumber: props.bedNumber.trim(),
    });
  }

  get roomId(): string {
    return this.props.roomId;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get bedNumber(): string {
    return this.props.bedNumber;
  }

  get displayOrder(): number {
    return this.props.displayOrder;
  }

  get status(): BedStatus {
    return this.props.status;
  }

  /**
   * Capacity Rule: AVAILABLE and MAINTENANCE beds occupy room capacity.
   * INACTIVE beds do NOT occupy room capacity.
   */
  public countsTowardCapacity(): boolean {
    return this.props.status === 'AVAILABLE' || this.props.status === 'MAINTENANCE';
  }
}
