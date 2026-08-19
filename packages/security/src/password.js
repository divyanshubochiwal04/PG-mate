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
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const argon2 = __importStar(require("argon2"));
const config_1 = require("@m-square/config");
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
function getArgon2Options() {
    return {
        type: argon2.argon2id,
        memoryCost: config_1.config.ARGON2_MEMORY_COST,
        timeCost: config_1.config.ARGON2_TIME_COST,
        parallelism: config_1.config.ARGON2_PARALLELISM,
    };
}
/**
 * Hashes a plaintext password using Argon2id with configurable parameters.
 * A cryptographically random salt is generated internally by the argon2 lib.
 * The returned encoded string is suitable for direct database storage.
 */
async function hashPassword(password) {
    return argon2.hash(password, getArgon2Options());
}
/**
 * Verifies a plaintext password against a stored Argon2id hash.
 * Returns false (never throws) for malformed, corrupted, or wrong-algorithm hashes.
 * Plaintext passwords are never logged or exposed via this function.
 */
async function verifyPassword(hash, password) {
    try {
        return await argon2.verify(hash, password);
    }
    catch {
        // Malformed hash string, incompatible algorithm, or corrupted data.
        // Fail securely — callers receive false, not an exception.
        return false;
    }
}
//# sourceMappingURL=password.js.map