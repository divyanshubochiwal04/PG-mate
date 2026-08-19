"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationEntity = void 0;
const base_entity_1 = require("./base.entity");
class OrganizationEntity extends base_entity_1.AggregateRoot {
    static create(props) {
        return new OrganizationEntity(props);
    }
    get name() {
        return this.props.name;
    }
    get slug() {
        return this.props.slug;
    }
    get status() {
        return this.props.status;
    }
    isActive() {
        return this.props.status === 'ACTIVE';
    }
}
exports.OrganizationEntity = OrganizationEntity;
//# sourceMappingURL=organization.entity.js.map