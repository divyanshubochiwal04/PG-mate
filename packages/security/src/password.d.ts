/**
 * Hashes a plaintext password using Argon2id with configurable parameters.
 * A cryptographically random salt is generated internally by the argon2 lib.
 * The returned encoded string is suitable for direct database storage.
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Verifies a plaintext password against a stored Argon2id hash.
 * Returns false (never throws) for malformed, corrupted, or wrong-algorithm hashes.
 * Plaintext passwords are never logged or exposed via this function.
 */
export declare function verifyPassword(hash: string, password: string): Promise<boolean>;
//# sourceMappingURL=password.d.ts.map