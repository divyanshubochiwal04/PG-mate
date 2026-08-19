"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.loadConfig = loadConfig;
const dotenv = __importStar(require("dotenv"));
const zod_1 = require("zod");
const path = __importStar(require("path"));
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
const configSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
    // --- Database ---
    // Full PostgreSQL connection URL. Local dev: postgresql://postgres:postgres@localhost:5432/m_square
    // NEVER use local dev credentials in production.
    DATABASE_URL: zod_1.z.string({
        required_error: 'DATABASE_URL is required. See .env.example for format.',
    }),
    // --- JWT / Auth ---
    // Generate with: openssl rand -base64 32
    // Minimum 32 characters enforced (256 bits) per NIST recommendation for HMAC-SHA256.
    JWT_SECRET: zod_1.z
        .string({ required_error: 'JWT_SECRET is required. Generate with: openssl rand -base64 32' })
        .min(32, 'JWT_SECRET must be at least 32 characters (256 bits). Generate with: openssl rand -base64 32'),
    JWT_ACCESS_EXPIRY: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRY: zod_1.z.string().default('7d'),
    // --- Storage ---
    STORAGE_PROVIDER: zod_1.z.enum(['local', 'supabase', 's3']).default('local'),
    STORAGE_BUCKET: zod_1.z.string().default('m-square-documents'),
    STORAGE_LOCAL_PATH: zod_1.z.string().default('./storage'),
    // Supabase storage fields — only required when STORAGE_PROVIDER=supabase
    SUPABASE_URL: zod_1.z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().optional(),
    // --- Rate Limiting ---
    RATE_LIMIT_TTL: zod_1.z
        .string()
        .transform((val) => parseInt(val, 10))
        .default('60'),
    RATE_LIMIT_MAX: zod_1.z
        .string()
        .transform((val) => parseInt(val, 10))
        .default('100'),
    // --- Argon2id Password Hashing Parameters ---
    // These values allow tuning without code changes as hardware scales.
    // Defaults meet OWASP recommendations for Argon2id.
    ARGON2_MEMORY_COST: zod_1.z
        .string()
        .transform((val) => parseInt(val, 10))
        .default('65536'), // 64 MB
    ARGON2_TIME_COST: zod_1.z
        .string()
        .transform((val) => parseInt(val, 10))
        .default('3'),
    ARGON2_PARALLELISM: zod_1.z
        .string()
        .transform((val) => parseInt(val, 10))
        .default('4'),
});
// ---------------------------------------------------------------------------
// loadConfig()
// Exported as a function so it can be called with controlled process.env
// in tests without triggering process.exit at import time.
// ---------------------------------------------------------------------------
function loadConfig(env = process.env) {
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
let _config;
try {
    _config = loadConfig();
}
catch (err) {
    console.error('❌', err.message);
    process.exit(1);
}
exports.config = _config;
//# sourceMappingURL=index.js.map