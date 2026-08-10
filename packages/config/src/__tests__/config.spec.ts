import { describe, it, expect } from 'vitest';
import { loadConfig } from '../index';

describe('@m-square/config - loadConfig()', () => {
  const BASE_ENV = {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/m_square',
    JWT_SECRET: 'a-32-character-strong-secret-key!!', // exactly 32 chars
  };

  it('should return valid config with all required fields present', () => {
    const cfg = loadConfig({ ...BASE_ENV });
    expect(cfg.DATABASE_URL).toBe(BASE_ENV.DATABASE_URL);
    expect(cfg.JWT_SECRET).toBe(BASE_ENV.JWT_SECRET);
    expect(cfg.NODE_ENV).toBe('test');
    expect(cfg.LOG_LEVEL).toBe('info'); // default
    expect(cfg.JWT_ACCESS_EXPIRY).toBe('15m'); // default
    expect(cfg.STORAGE_PROVIDER).toBe('local'); // default
  });

  it('should throw when DATABASE_URL is missing', () => {
    const env = { ...BASE_ENV } as Record<string, string | undefined>;
    delete env['DATABASE_URL'];
    expect(() => loadConfig(env as NodeJS.ProcessEnv)).toThrow(/DATABASE_URL/);
  });

  it('should throw when JWT_SECRET is missing', () => {
    const env = { ...BASE_ENV } as Record<string, string | undefined>;
    delete env['JWT_SECRET'];
    expect(() => loadConfig(env as NodeJS.ProcessEnv)).toThrow(/JWT_SECRET/);
  });

  it('should throw when JWT_SECRET is shorter than 32 characters', () => {
    const env = { ...BASE_ENV, JWT_SECRET: 'too-short' };
    expect(() => loadConfig(env as NodeJS.ProcessEnv)).toThrow(/32 characters/);
  });

  it('should use defaults for optional fields', () => {
    const cfg = loadConfig({ ...BASE_ENV });
    expect(cfg.RATE_LIMIT_TTL).toBe(60);
    expect(cfg.RATE_LIMIT_MAX).toBe(100);
    expect(cfg.JWT_REFRESH_EXPIRY).toBe('7d');
    expect(cfg.ARGON2_MEMORY_COST).toBe(65536);
    expect(cfg.ARGON2_TIME_COST).toBe(3);
    expect(cfg.ARGON2_PARALLELISM).toBe(4);
  });

  it('should reject invalid NODE_ENV values', () => {
    const env = { ...BASE_ENV, NODE_ENV: 'staging' };
    expect(() => loadConfig(env as NodeJS.ProcessEnv)).toThrow();
  });

  it('should parse numeric string env vars as numbers', () => {
    const cfg = loadConfig({ ...BASE_ENV, RATE_LIMIT_TTL: '120', RATE_LIMIT_MAX: '50' });
    expect(cfg.RATE_LIMIT_TTL).toBe(120);
    expect(cfg.RATE_LIMIT_MAX).toBe(50);
  });
});
