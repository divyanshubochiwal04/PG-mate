import { describe, it, expect } from 'vitest';

// Set up required env vars before importing modules that call config singleton
// (password.ts and token.ts import @m-square/config which loads process.env)
process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';
process.env['JWT_SECRET'] = 'test-secret-for-unit-tests-at-least-32-chars!!';

import { hashPassword, verifyPassword } from '../password';
import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../token';
import { constantTimeCompare } from '../crypto';

// ============================================================================
// Password Hashing Tests
// ============================================================================
describe('hashPassword / verifyPassword', () => {
  it('should produce a hash from a plaintext password', async () => {
    const hash = await hashPassword('MySecureP@ssw0rd');
    expect(hash).toBeTruthy();
    expect(typeof hash).toBe('string');
    expect(hash).toContain('$argon2id$');
  });

  it('should verify the correct password against its hash', async () => {
    const password = 'CorrectPassword123!';
    const hash = await hashPassword(password);
    const result = await verifyPassword(hash, password);
    expect(result).toBe(true);
  });

  it('should reject a wrong password', async () => {
    const hash = await hashPassword('CorrectPassword123!');
    const result = await verifyPassword(hash, 'WrongPassword!');
    expect(result).toBe(false);
  });

  it('should return false (not throw) for a malformed hash', async () => {
    const result = await verifyPassword('not-a-valid-hash-string', 'anypassword');
    expect(result).toBe(false);
  });

  it('should produce different hashes for the same password (random salt)', async () => {
    const hash1 = await hashPassword('SamePassword!');
    const hash2 = await hashPassword('SamePassword!');
    expect(hash1).not.toBe(hash2);
  });
});

// ============================================================================
// JWT Token Tests
// ============================================================================
describe('generateAccessToken / verifyAccessToken', () => {
  it('should generate a valid JWT token', () => {
    const token = generateAccessToken({ userId: '123', role: 'OWNER' });
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // header.payload.signature
  });

  it('should verify a valid token and return the payload', () => {
    const payload = { userId: 'user-abc', organizationId: 'org-xyz', role: 'MANAGER' };
    const token = generateAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded['userId']).toBe('user-abc');
    expect(decoded['organizationId']).toBe('org-xyz');
    expect(decoded['role']).toBe('MANAGER');
  });

  it('should throw on a tampered token', () => {
    const token = generateAccessToken({ userId: '123' });
    const tampered = token.slice(0, -5) + 'xxxxx';
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('should throw on a token signed with a different secret', () => {
    const jwt = require('jsonwebtoken');
    const foreignToken = jwt.sign({ userId: '123' }, 'completely-different-secret-32chars!!', {
      algorithm: 'HS256',
    });
    expect(() => verifyAccessToken(foreignToken)).toThrow();
  });
});

// ============================================================================
// Refresh Token Tests
// ============================================================================
describe('generateRefreshToken / hashRefreshToken', () => {
  it('should generate a non-empty base64url string', () => {
    const token = generateRefreshToken();
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    // base64url has no +, /, or = characters
    expect(token).not.toMatch(/[+/=]/);
  });

  it('should generate unique tokens on each call', () => {
    const t1 = generateRefreshToken();
    const t2 = generateRefreshToken();
    expect(t1).not.toBe(t2);
  });

  it('should produce a consistent SHA-256 hex hash', () => {
    const token = 'known-test-token-value';
    const hash1 = hashRefreshToken(token);
    const hash2 = hashRefreshToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/); // 64-char hex = SHA-256
  });

  it('should produce different hashes for different tokens', () => {
    expect(hashRefreshToken('token-a')).not.toBe(hashRefreshToken('token-b'));
  });
});

// ============================================================================
// Constant-Time Comparison Tests
// ============================================================================
describe('constantTimeCompare', () => {
  it('should return true for identical strings', () => {
    expect(constantTimeCompare('hello', 'hello')).toBe(true);
  });

  it('should return false for different strings of the same length', () => {
    expect(constantTimeCompare('aaaa', 'bbbb')).toBe(false);
  });

  it('should return false for strings of different lengths', () => {
    expect(constantTimeCompare('short', 'much-longer-string')).toBe(false);
  });

  it('should return true for empty strings', () => {
    expect(constantTimeCompare('', '')).toBe(true);
  });

  it('should handle unicode characters', () => {
    expect(constantTimeCompare('héllo', 'héllo')).toBe(true);
    expect(constantTimeCompare('héllo', 'hello')).toBe(false);
  });
});
