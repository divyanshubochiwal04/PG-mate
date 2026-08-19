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
exports.generateAccessToken = generateAccessToken;
exports.verifyAccessToken = verifyAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.hashRefreshToken = hashRefreshToken;
const jwt = __importStar(require("jsonwebtoken"));
const crypto = __importStar(require("crypto"));
const config_1 = require("@m-square/config");
// ---------------------------------------------------------------------------
// JWT Algorithm — explicitly locked to prevent algorithm confusion attacks.
// The 'alg:none' CVE allows unsigned tokens if algorithm is not specified.
// If migrating to asymmetric keys (RS256), update both sign and verify here.
// ---------------------------------------------------------------------------
const JWT_ALGORITHM = 'HS256';
/**
 * Generates a short-lived JWT access token signed with HS256.
 * Expiry comes from validated config (default: 15 minutes).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateAccessToken(payload) {
    const options = {
        algorithm: JWT_ALGORITHM,
        expiresIn: config_1.config.JWT_ACCESS_EXPIRY,
    };
    return jwt.sign(payload, config_1.config.JWT_SECRET, options);
}
/**
 * Verifies a JWT access token and returns the decoded payload.
 * The algorithm whitelist prevents confusion attacks.
 * Throws a JsonWebTokenError on invalid, expired, or tampered tokens.
 */
function verifyAccessToken(token) {
    const decoded = jwt.verify(token, config_1.config.JWT_SECRET, {
        algorithms: [JWT_ALGORITHM],
    });
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error('Invalid token payload format.');
    }
    return decoded;
}
/**
 * Generates a cryptographically secure random refresh token.
 * 32 bytes = 256 bits of entropy, encoded as base64url (no padding, URL-safe).
 */
function generateRefreshToken() {
    return crypto.randomBytes(32).toString('base64url');
}
/**
 * Hashes a refresh token with SHA-256 for safe database storage.
 * The plaintext token is returned to the client; only the hash is stored.
 * To verify: hash the incoming token, compare against the stored hash.
 */
function hashRefreshToken(token) {
    if (!token || typeof token !== 'string') {
        throw new Error('Invalid refresh token: token must be a non-empty string');
    }
    return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}
//# sourceMappingURL=token.js.map