"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingEntity = void 0;
const base_entity_1 = require("./base.entity");
const domain_error_1 = require("../errors/domain.error");
class BuildingEntity extends base_entity_1.AggregateRoot {
    static create(props) {
        if (!props.name || props.name.trim().length === 0) {
            throw new domain_error_1.BusinessRuleValidationError('Building name cannot be empty');
        }
        if (!props.code || props.code.trim().length === 0) {
            throw new domain_error_1.BusinessRuleValidationError('Building code cannot be empty');
        }
        return new BuildingEntity({
            ...props,
            name: props.name.trim(),
            code: props.code.trim().toUpperCase(),
        });
    }
    get propertyId() {
        return this.props.propertyId;
    }
    get organizationId() {
        return this.props.organizationId;
    }
    get name() {
        return this.props.name;
    }
    get code() {
        return this.props.code;
    }
    get displayOrder() {
        return this.props.displayOrder;
    }
    get status() {
        return this.props.status;
    }
}
exports.BuildingEntity = BuildingEntity;
//# sourceMappingURL=building.entity.js.map