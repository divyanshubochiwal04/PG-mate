import { describe, expect, it } from 'vitest';
import { normalizeApiError } from '../api/error';

describe('apps/mobile — API Error Normalizer', () => {
  it('E1 — normalizes 401 Unauthorized response', () => {
    const error = normalizeApiError({ response: { status: 401, data: {} } });
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Invalid email or password.');
  });

  it('E2 — normalizes Network Error / offline connection failure', () => {
    const error = normalizeApiError({ request: {}, message: 'Network Error' });
    expect(error.statusCode).toBe(0);
    expect(error.message).toContain('Unable to connect to the server');
  });

  it('E3 — extracts backend validation array messages', () => {
    const error = normalizeApiError({
      response: {
        status: 400,
        data: { message: ['email must be a valid email', 'password is too short'] },
      },
    });
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('email must be a valid email, password is too short');
  });
});
