"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomEntity = void 0;
const openapi = require("@nestjs/swagger");
const base_entity_1 = require("./base.entity");
const domain_error_1 = require("../errors/domain.error");
class RoomEntity extends base_entity_1.AggregateRoot {
    static create(props) {
        if (!props.roomNumber || props.roomNumber.trim().length === 0) {
            throw new domain_error_1.BusinessRuleValidationError('Room number cannot be empty');
        }
        if (props.capacity < 1) {
            throw new domain_error_1.BusinessRuleValidationError('Room capacity must be at least 1');
        }
        return new RoomEntity({
            ...props,
            roomNumber: props.roomNumber.trim(),
        });
    }
    get floorId() {
        return this.props.floorId;
    }
    get buildingId() {
        return this.props.buildingId;
    }
    get propertyId() {
        return this.props.propertyId;
    }
    get organizationId() {
        return this.props.organizationId;
    }
    get roomNumber() {
        return this.props.roomNumber;
    }
    get roomType() {
        return this.props.roomType;
    }
    get capacity() {
        return this.props.capacity;
    }
    get displayOrder() {
        return this.props.displayOrder;
    }
    get status() {
        return this.props.status;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.RoomEntity = RoomEntity;
//# sourceMappingURL=room.entity.js.map