import { describe, expect, it } from 'vitest';
import {
  BusinessRuleValidationError,
  EntityConflictError,
  EntityNotFoundError,
} from '../errors/domain.error';

describe('@m-square/domain - Errors', () => {
  it('EntityNotFoundError should set code and message correctly', () => {
    const err = new EntityNotFoundError('Tenant', 'tenant-123');
    expect(err.code).toBe('ENTITY_NOT_FOUND');
    expect(err.message).toContain("Tenant with identifier 'tenant-123' was not found");
    expect(err.details).toEqual({ entityName: 'Tenant', identifier: 'tenant-123' });
  });

  it('BusinessRuleValidationError should set code and details', () => {
    const err = new BusinessRuleValidationError('Bed is already occupied', { bedId: 'b-1' });
    expect(err.code).toBe('BUSINESS_RULE_VIOLATION');
    expect(err.message).toBe('Bed is already occupied');
    expect(err.details).toEqual({ bedId: 'b-1' });
  });

  it('EntityConflictError should set code correctly', () => {
    const err = new EntityConflictError('Email already registered');
    expect(err.code).toBe('ENTITY_CONFLICT');
    expect(err.message).toBe('Email already registered');
  });
});
