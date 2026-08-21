"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyEntity = void 0;
const openapi = require("@nestjs/swagger");
const base_entity_1 = require("./base.entity");
const domain_error_1 = require("../errors/domain.error");
class PropertyEntity extends base_entity_1.AggregateRoot {
    static create(props) {
        if (!props.name || props.name.trim().length === 0) {
            throw new domain_error_1.BusinessRuleValidationError('Property name cannot be empty');
        }
        if (!props.code || props.code.trim().length === 0) {
            throw new domain_error_1.BusinessRuleValidationError('Property code cannot be empty');
        }
        if (!props.address.addressLine1 || props.address.addressLine1.trim().length === 0) {
            throw new domain_error_1.BusinessRuleValidationError('Address line 1 cannot be empty');
        }
        if (!props.address.locality || props.address.locality.trim().length === 0) {
            throw new domain_error_1.BusinessRuleValidationError('Locality cannot be empty');
        }
        if (!props.address.city || props.address.city.trim().length === 0) {
            throw new domain_error_1.BusinessRuleValidationError('City cannot be empty');
        }
        if (!props.address.state || props.address.state.trim().length === 0) {
            throw new domain_error_1.BusinessRuleValidationError('State cannot be empty');
        }
        if (!props.address.postalCode || props.address.postalCode.trim().length === 0) {
            throw new domain_error_1.BusinessRuleValidationError('Postal code cannot be empty');
        }
        return new PropertyEntity({
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
    get address() {
        return this.props.address;
    }
    get status() {
        return this.props.status;
    }
    isActive() {
        return this.props.status === 'ACTIVE';
    }
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.PropertyEntity = PropertyEntity;
//# sourceMappingURL=property.entity.js.map