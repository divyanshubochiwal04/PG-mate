import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { config } from '@m-square/config';

// ---------------------------------------------------------------------------
// JWT Algorithm — explicitly locked to prevent algorithm confusion attacks.
// The 'alg:none' CVE allows unsigned tokens if algorithm is not specified.
// If migrating to asymmetric keys (RS256), update both sign and verify here.
// ---------------------------------------------------------------------------
const JWT_ALGORITHM: jwt.Algorithm = 'HS256';

/**
 * Generates a short-lived JWT access token signed with HS256.
 * Expiry comes from validated config (default: 15 minutes).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateAccessToken(payload: Record<string, any>): string {
  const options: jwt.SignOptions = {
    algorithm: JWT_ALGORITHM,
    expiresIn: config.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, config.JWT_SECRET, options);
}

/**
 * Verifies a JWT access token and returns the decoded payload.
 * The algorithm whitelist prevents confusion attacks.
 * Throws a JsonWebTokenError on invalid, expired, or tampered tokens.
 */
export function verifyAccessToken(token: string): jwt.JwtPayload {
  const decoded = jwt.verify(token, config.JWT_SECRET, {
    algorithms: [JWT_ALGORITHM],
  });
  if (typeof decoded !== 'object' || decoded === null) {
    throw new Error('Invalid token payload format.');
  }
  return decoded as jwt.JwtPayload;
}

/**
 * Generates a cryptographically secure random refresh token.
 * 32 bytes = 256 bits of entropy, encoded as base64url (no padding, URL-safe).
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Hashes a refresh token with SHA-256 for safe database storage.
 * The plaintext token is returned to the client; only the hash is stored.
 * To verify: hash the incoming token, compare against the stored hash.
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}
