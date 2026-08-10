import * as dotenv from 'dotenv';
import { z } from 'zod';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Environment Loading
// dotenv loads from the current working directory first. The second call
// targets the monorepo root when this package is consumed by a sub-package.
// process.env values already set (e.g. by CI) will NOT be overridden.
// ---------------------------------------------------------------------------
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env'), override: false });

// ---------------------------------------------------------------------------
// Configuration Schema
// All required variables must be present at startup. Optional variables have
// sensible defaults. The PORT variable is intentionally excluded from this
// shared package — port configuration belongs at the application layer
// (apps/api), not in shared infrastructure.
// ---------------------------------------------------------------------------
const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),

  // --- Database ---
  // Full PostgreSQL connection URL. Local dev: postgresql://postgres:postgres@localhost:5432/m_square
  // NEVER use local dev credentials in production.
  DATABASE_URL: z.string({
    required_error: 'DATABASE_URL is required. See .env.example for format.',
  }),

  // --- JWT / Auth ---
  // Generate with: openssl rand -base64 32
  // Minimum 32 characters enforced (256 bits) per NIST recommendation for HMAC-SHA256.
  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET is required. Generate with: openssl rand -base64 32' })
    .min(32, 'JWT_SECRET must be at least 32 characters (256 bits). Generate with: openssl rand -base64 32'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // --- Storage ---
  STORAGE_PROVIDER: z.enum(['local', 'supabase', 's3']).default('local'),
  STORAGE_BUCKET: z.string().default('m-square-documents'),
  STORAGE_LOCAL_PATH: z.string().default('./storage'),
  // Supabase storage fields — only required when STORAGE_PROVIDER=supabase
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // --- Rate Limiting ---
  RATE_LIMIT_TTL: z.string().transform((val) => parseInt(val, 10)).default('60'),
  RATE_LIMIT_MAX: z.string().transform((val) => parseInt(val, 10)).default('100'),

  // --- Argon2id Password Hashing Parameters ---
  // These values allow tuning without code changes as hardware scales.
  // Defaults meet OWASP recommendations for Argon2id.
  ARGON2_MEMORY_COST: z.string().transform((val) => parseInt(val, 10)).default('65536'), // 64 MB
  ARGON2_TIME_COST: z.string().transform((val) => parseInt(val, 10)).default('3'),
  ARGON2_PARALLELISM: z.string().transform((val) => parseInt(val, 10)).default('4'),
});

export type Config = z.infer<typeof configSchema>;

// ---------------------------------------------------------------------------
// loadConfig()
// Exported as a function so it can be called with controlled process.env
// in tests without triggering process.exit at import time.
// ---------------------------------------------------------------------------
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = configSchema.safeParse(env);

  if (!result.success) {
    const messages = result.error.errors
      .map((e) => `  • ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Configuration validation failed:\n${messages}`);
  }

  return result.data;
}

// ---------------------------------------------------------------------------
// config — singleton for runtime use.
// Throws and exits on invalid configuration at application boot.
// ---------------------------------------------------------------------------
let _config: Config;

try {
  _config = loadConfig();
} catch (err) {
  console.error('❌', (err as Error).message);
  process.exit(1);
}

export const config = _config;

