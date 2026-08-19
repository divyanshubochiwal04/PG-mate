/**
 * Base class for all domain-level exceptions in M Square.
 * Domain exceptions represent business rule violations and are
 * framework-agnostic.
 */
export declare abstract class DomainError extends Error {
    readonly details?: Record<string, unknown> | undefined;
    abstract readonly code: string;
    constructor(message: string, details?: Record<string, unknown> | undefined);
}
/**
 * Thrown when an requested domain entity is not found.
 */
export declare class EntityNotFoundError extends DomainError {
    readonly code = "ENTITY_NOT_FOUND";
    constructor(entityName: string, identifier: string | number);
}
/**
 * Thrown when an operation violates a domain invariant or business rule.
 */
export declare class BusinessRuleValidationError extends DomainError {
    readonly code = "BUSINESS_RULE_VIOLATION";
    constructor(message: string, details?: Record<string, unknown>);
}
/**
 * Thrown when a unique constraint or conflict occurs at the domain level.
 */
export declare class EntityConflictError extends DomainError {
    readonly code = "ENTITY_CONFLICT";
    constructor(message: string, details?: Record<string, unknown>);
}
//# sourceMappingURL=domain.error.d.ts.map