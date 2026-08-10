import { describe, it, expect } from 'vitest';
import { createAppLogger } from '../index';

describe('@m-square/logger - redactObject', () => {
  function getLogger() {
    return createAppLogger({ nodeEnv: 'test', logLevel: 'info' });
  }

  // We test redaction by accessing the private redactObject behavior via
  // a helper. Since the function is internal, we verify indirectly through
  // the re-exported helper or by inspecting log output using a spy.
  // For deterministic testing, we expose a separate utility.
  it('logger instance should be created without throwing', () => {
    expect(() => getLogger()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Direct unit tests for redaction logic (extracted for testability)
// ---------------------------------------------------------------------------
import { redactSensitiveData } from '../redact';

describe('@m-square/logger - redactSensitiveData', () => {
  it('should redact top-level password field', () => {
    const result = redactSensitiveData({ username: 'alice', password: 'hunter2' });
    expect(result.password).toBe('[REDACTED]');
    expect(result.username).toBe('alice');
  });

  it('should redact nested token fields', () => {
    const result = redactSensitiveData({ data: { token: 'abc123', name: 'test' } });
    expect(result.data.token).toBe('[REDACTED]');
    expect(result.data.name).toBe('test');
  });

  it('should redact fields in arrays', () => {
    const result = redactSensitiveData([{ secret: 'x' }, { name: 'ok' }]);
    expect(result[0].secret).toBe('[REDACTED]');
    expect(result[1].name).toBe('ok');
  });

  it('should handle circular references without crashing', () => {
    const obj: any = { name: 'test' };
    obj.self = obj; // circular reference
    expect(() => redactSensitiveData(obj)).not.toThrow();
    const result = redactSensitiveData(obj);
    expect(result.self).toBe('[Circular]');
  });

  it('should handle Error objects safely', () => {
    const err = new Error('Something went wrong');
    const result = redactSensitiveData({ error: err });
    expect(result.error.message).toBe('Something went wrong');
    expect(result.error.name).toBe('Error');
  });

  it('should redact cookie, api_key, and database_url fields', () => {
    const result = redactSensitiveData({
      cookie: 'session=abc',
      api_key: 'sk-123',
      database_url: 'postgresql://user:pass@host/db',
      safe: 'visible',
    });
    expect(result.cookie).toBe('[REDACTED]');
    expect(result.api_key).toBe('[REDACTED]');
    expect(result.database_url).toBe('[REDACTED]');
    expect(result.safe).toBe('visible');
  });

  it('should return primitives unchanged', () => {
    expect(redactSensitiveData(42)).toBe(42);
    expect(redactSensitiveData('hello')).toBe('hello');
    expect(redactSensitiveData(null)).toBe(null);
    expect(redactSensitiveData(undefined)).toBe(undefined);
  });

  it('should be case-insensitive for key matching', () => {
    const result = redactSensitiveData({ Password: 'secret', TOKEN: 'abc' });
    expect(result['Password']).toBe('[REDACTED]');
    expect(result['TOKEN']).toBe('[REDACTED]');
  });
});
