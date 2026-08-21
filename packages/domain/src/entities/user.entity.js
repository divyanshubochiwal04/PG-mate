"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEntity = void 0;
const openapi = require("@nestjs/swagger");
const base_entity_1 = require("./base.entity");
class UserEntity extends base_entity_1.AggregateRoot {
    static create(props) {
        return new UserEntity(props);
    }
    get email() {
        return this.props.email;
    }
    get passwordHash() {
        return this.props.passwordHash;
    }
    get status() {
        return this.props.status;
    }
    get emailVerifiedAt() {
        return this.props.emailVerifiedAt;
    }
    get lastLoginAt() {
        return this.props.lastLoginAt;
    }
    isActive() {
        return this.props.status === 'ACTIVE';
    }
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UserEntity = UserEntity;
//# sourceMappingURL=user.entity.js.map