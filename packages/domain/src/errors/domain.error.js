"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityConflictError = exports.BusinessRuleValidationError = exports.EntityNotFoundError = exports.DomainError = void 0;
/**
 * Base class for all domain-level exceptions in M Square.
 * Domain exceptions represent business rule violations and are
 * framework-agnostic.
 */
class DomainError extends Error {
    details;
    constructor(message, details) {
        super(message);
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
exports.DomainError = DomainError;
/**
 * Thrown when an requested domain entity is not found.
 */
class EntityNotFoundError extends DomainError {
    code = 'ENTITY_NOT_FOUND';
    constructor(entityName, identifier) {
        super(`${entityName} with identifier '${identifier}' was not found.`, {
            entityName,
            identifier,
        });
    }
}
exports.EntityNotFoundError = EntityNotFoundError;
/**
 * Thrown when an operation violates a domain invariant or business rule.
 */
class BusinessRuleValidationError extends DomainError {
    code = 'BUSINESS_RULE_VIOLATION';
    constructor(message, details) {
        super(message, details);
    }
}
exports.BusinessRuleValidationError = BusinessRuleValidationError;
/**
 * Thrown when a unique constraint or conflict occurs at the domain level.
 */
class EntityConflictError extends DomainError {
    code = 'ENTITY_CONFLICT';
    constructor(message, details) {
        super(message, details);
    }
}
exports.EntityConflictError = EntityConflictError;
//# sourceMappingURL=domain.error.js.map