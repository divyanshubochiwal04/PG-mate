"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FloorEntity = void 0;
const base_entity_1 = require("./base.entity");
const domain_error_1 = require("../errors/domain.error");
class FloorEntity extends base_entity_1.AggregateRoot {
    static create(props) {
        if (!props.name || props.name.trim().length === 0) {
            throw new domain_error_1.BusinessRuleValidationError('Floor name cannot be empty');
        }
        return new FloorEntity({
            ...props,
            name: props.name.trim(),
        });
    }
    get buildingId() {
        return this.props.buildingId;
    }
    get organizationId() {
        return this.props.organizationId;
    }
    get name() {
        return this.props.name;
    }
    get floorNumber() {
        return this.props.floorNumber;
    }
    get displayOrder() {
        return this.props.displayOrder;
    }
    get status() {
        return this.props.status;
    }
}
exports.FloorEntity = FloorEntity;
//# sourceMappingURL=floor.entity.js.map