import { AggregateRoot, type BaseEntityProps } from './base.entity';
import { BusinessRuleValidationError } from '../errors/domain.error';

export type RoomStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type RoomType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR_BED' | 'DORMITORY' | 'CUSTOM';

export interface RoomProps extends BaseEntityProps {
  floorId: string;
  buildingId: string;
  propertyId: string;
  organizationId: string;
  roomNumber: string;
  roomType: RoomType;
  capacity: number;
  displayOrder: number;
  status: RoomStatus;
}

export class RoomEntity extends AggregateRoot<RoomProps> {
  public static create(props: RoomProps): RoomEntity {
    if (!props.roomNumber || props.roomNumber.trim().length === 0) {
      throw new BusinessRuleValidationError('Room number cannot be empty');
    }
    if (props.capacity < 1) {
      throw new BusinessRuleValidationError('Room capacity must be at least 1');
    }

    return new RoomEntity({
      ...props,
      roomNumber: props.roomNumber.trim(),
    });
  }

  get floorId(): string {
    return this.props.floorId;
  }

  get buildingId(): string {
    return this.props.buildingId;
  }

  get propertyId(): string {
    return this.props.propertyId;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get roomNumber(): string {
    return this.props.roomNumber;
  }

  get roomType(): RoomType {
    return this.props.roomType;
  }

  get capacity(): number {
    return this.props.capacity;
  }

  get displayOrder(): number {
    return this.props.displayOrder;
  }

  get status(): RoomStatus {
    return this.props.status;
  }
}
