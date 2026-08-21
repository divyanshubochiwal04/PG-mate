"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateRoot = void 0;
const openapi = require("@nestjs/swagger");
class AggregateRoot {
    props;
    constructor(props) {
        this.props = props;
    }
    get id() {
        return this.props.id;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    toJSON() {
        return { ...this.props };
    }
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.AggregateRoot = AggregateRoot;
//# sourceMappingURL=base.entity.js.map