import { describe, expect, it } from 'vitest';
import { PasswordPolicy } from '../value-objects/password-policy.vo';
import { BusinessRuleValidationError } from '../errors/domain.error';

describe('@m-square/domain - PasswordPolicy & EmailNormalization', () => {
  it('should normalize email by trimming whitespace and lowercasing', () => {
    expect(PasswordPolicy.normalizeEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
  });

  it('should throw BusinessRuleValidationError for empty or non-string email', () => {
    expect(() => PasswordPolicy.normalizeEmail('')).toThrow(BusinessRuleValidationError);
  });

  it('should accept valid passwords between 8 and 128 characters', () => {
    expect(() => PasswordPolicy.validate('ValidP@ssw0rd')).not.toThrow();
  });

  it('should throw BusinessRuleValidationError if password is under 8 characters', () => {
    expect(() => PasswordPolicy.validate('short')).toThrow(BusinessRuleValidationError);
  });

  it('should throw BusinessRuleValidationError if password exceeds 128 characters', () => {
    const longPassword = 'a'.repeat(129);
    expect(() => PasswordPolicy.validate(longPassword)).toThrow(BusinessRuleValidationError);
  });
});
