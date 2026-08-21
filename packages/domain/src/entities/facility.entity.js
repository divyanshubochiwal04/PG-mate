"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacilityEntity = void 0;
const openapi = require("@nestjs/swagger");
const base_entity_1 = require("./base.entity");
const domain_error_1 = require("../errors/domain.error");
class FacilityEntity extends base_entity_1.AggregateRoot {
    static create(props) {
        if (!props.name || props.name.trim().length === 0) {
            throw new domain_error_1.BusinessRuleValidationError('Facility name cannot be empty');
        }
        if (!props.code || props.code.trim().length === 0) {
            throw new domain_error_1.BusinessRuleValidationError('Facility code cannot be empty');
        }
        return new FacilityEntity({
            ...props,
            name: props.name.trim(),
            code: props.code.trim().toUpperCase(),
        });
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
    get category() {
        return this.props.category;
    }
    get description() {
        return this.props.description;
    }
    get status() {
        return this.props.status;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.FacilityEntity = FacilityEntity;
//# sourceMappingURL=facility.entity.js.map