import * as argon2 from 'argon2';
import { config } from '@m-square/config';

// ---------------------------------------------------------------------------
// Argon2id Hashing
// Parameters follow OWASP Cheat Sheet recommendations for Argon2id:
//   - Memory: 64 MB default (65536 KiB) — configurable via ARGON2_MEMORY_COST
//   - Iterations (timeCost): 3 — configurable via ARGON2_TIME_COST
//   - Parallelism: 4 — configurable via ARGON2_PARALLELISM
//     Note: parallelism should not exceed the number of physical CPU cores.
//
// The argon2 library generates a cryptographically secure random salt
// internally. The returned hash string encodes algorithm, params, salt, and
// hash digest — it is completely self-contained for verification.
// ---------------------------------------------------------------------------
function getArgon2Options(): argon2.Options & { raw?: false } {
  return {
    type: argon2.argon2id,
    memoryCost: config.ARGON2_MEMORY_COST,
    timeCost: config.ARGON2_TIME_COST,
    parallelism: config.ARGON2_PARALLELISM,
  };
}

/**
 * Hashes a plaintext password using Argon2id with configurable parameters.
 * A cryptographically random salt is generated internally by the argon2 lib.
 * The returned encoded string is suitable for direct database storage.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, getArgon2Options());
}

/**
 * Verifies a plaintext password against a stored Argon2id hash.
 * Returns false (never throws) for malformed, corrupted, or wrong-algorithm hashes.
 * Plaintext passwords are never logged or exposed via this function.
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    // Malformed hash string, incompatible algorithm, or corrupted data.
    // Fail securely — callers receive false, not an exception.
    return false;
  }
}
