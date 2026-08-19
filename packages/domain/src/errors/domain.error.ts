/**
 * Base class for all domain-level exceptions in M Square.
 * Domain exceptions represent business rule violations and are
 * framework-agnostic.
 */
export abstract class DomainError extends Error {
  public abstract readonly code: string;

  constructor(
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    if (typeof (Error as unknown as { captureStackTrace?: (target: object, constructorOpt?: unknown) => void }).captureStackTrace === 'function') {
      (Error as unknown as { captureStackTrace: (target: object, constructorOpt?: unknown) => void }).captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Thrown when an requested domain entity is not found.
 */
export class EntityNotFoundError extends DomainError {
  public readonly code = 'ENTITY_NOT_FOUND';

  constructor(entityName: string, identifier: string | number) {
    super(`${entityName} with identifier '${identifier}' was not found.`, {
      entityName,
      identifier,
    });
  }
}

/**
 * Thrown when an operation violates a domain invariant or business rule.
 */
export class BusinessRuleValidationError extends DomainError {
  public readonly code = 'BUSINESS_RULE_VIOLATION';

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}

/**
 * Thrown when a unique constraint or conflict occurs at the domain level.
 */
export class EntityConflictError extends DomainError {
  public readonly code = 'ENTITY_CONFLICT';

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}
