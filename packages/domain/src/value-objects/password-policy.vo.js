"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordPolicy = void 0;
const domain_error_1 = require("../errors/domain.error");
class PasswordPolicy {
    static MIN_LENGTH = 8;
    static MAX_LENGTH = 128;
    static validate(password) {
        if (!password || typeof password !== 'string') {
            throw new domain_error_1.BusinessRuleValidationError('Password must be a non-empty string.');
        }
        const trimmed = password.trim();
        if (trimmed.length < this.MIN_LENGTH) {
            throw new domain_error_1.BusinessRuleValidationError(`Password must be at least ${this.MIN_LENGTH} characters long.`);
        }
        if (trimmed.length > this.MAX_LENGTH) {
            throw new domain_error_1.BusinessRuleValidationError(`Password must not exceed ${this.MAX_LENGTH} characters.`);
        }
    }
    static normalizeEmail(email) {
        if (!email || typeof email !== 'string') {
            throw new domain_error_1.BusinessRuleValidationError('Email must be a non-empty string.');
        }
        return email.trim().toLowerCase();
    }
}
exports.PasswordPolicy = PasswordPolicy;
//# sourceMappingURL=password-policy.vo.js.map