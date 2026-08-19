import * as jwt from 'jsonwebtoken';
/**
 * Generates a short-lived JWT access token signed with HS256.
 * Expiry comes from validated config (default: 15 minutes).
 */
export declare function generateAccessToken(payload: Record<string, any>): string;
/**
 * Verifies a JWT access token and returns the decoded payload.
 * The algorithm whitelist prevents confusion attacks.
 * Throws a JsonWebTokenError on invalid, expired, or tampered tokens.
 */
export declare function verifyAccessToken(token: string): jwt.JwtPayload;
/**
 * Generates a cryptographically secure random refresh token.
 * 32 bytes = 256 bits of entropy, encoded as base64url (no padding, URL-safe).
 */
export declare function generateRefreshToken(): string;
/**
 * Hashes a refresh token with SHA-256 for safe database storage.
 * The plaintext token is returned to the client; only the hash is stored.
 * To verify: hash the incoming token, compare against the stored hash.
 */
export declare function hashRefreshToken(token: string): string;
//# sourceMappingURL=token.d.ts.map