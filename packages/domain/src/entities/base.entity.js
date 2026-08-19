"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateRoot = void 0;
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
}
exports.AggregateRoot = AggregateRoot;
//# sourceMappingURL=base.entity.js.map