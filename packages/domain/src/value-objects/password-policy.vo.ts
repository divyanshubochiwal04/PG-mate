import { BusinessRuleValidationError } from '../errors/domain.error';

export class PasswordPolicy {
  public static readonly MIN_LENGTH = 8;
  public static readonly MAX_LENGTH = 128;

  public static validate(password: string): void {
    if (!password || typeof password !== 'string') {
      throw new BusinessRuleValidationError('Password must be a non-empty string.');
    }

    const trimmed = password.trim();
    if (trimmed.length < this.MIN_LENGTH) {
      throw new BusinessRuleValidationError(
        `Password must be at least ${this.MIN_LENGTH} characters long.`
      );
    }

    if (trimmed.length > this.MAX_LENGTH) {
      throw new BusinessRuleValidationError(
        `Password must not exceed ${this.MAX_LENGTH} characters.`
      );
    }
  }

  public static normalizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      throw new BusinessRuleValidationError('Email must be a non-empty string.');
    }
    return email.trim().toLowerCase();
  }
}
