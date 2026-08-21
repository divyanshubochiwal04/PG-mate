"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedEntity = void 0;
const openapi = require("@nestjs/swagger");
const base_entity_1 = require("./base.entity");
const domain_error_1 = require("../errors/domain.error");
class BedEntity extends base_entity_1.AggregateRoot {
    static create(props) {
        if (!props.bedNumber || props.bedNumber.trim().length === 0) {
            throw new domain_error_1.BusinessRuleValidationError('Bed number/label cannot be empty');
        }
        return new BedEntity({
            ...props,
            bedNumber: props.bedNumber.trim(),
        });
    }
    get roomId() {
        return this.props.roomId;
    }
    get organizationId() {
        return this.props.organizationId;
    }
    get bedNumber() {
        return this.props.bedNumber;
    }
    get displayOrder() {
        return this.props.displayOrder;
    }
    get status() {
        return this.props.status;
    }
    /**
     * Capacity Rule: AVAILABLE and MAINTENANCE beds occupy room capacity.
     * INACTIVE beds do NOT occupy room capacity.
     */
    countsTowardCapacity() {
        return this.props.status === 'AVAILABLE' || this.props.status === 'MAINTENANCE';
    }
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.BedEntity = BedEntity;
//# sourceMappingURL=bed.entity.js.map