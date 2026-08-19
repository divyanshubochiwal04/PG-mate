"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeSortField = sanitizeSortField;
exports.sanitizeSortOrder = sanitizeSortOrder;
/**
 * Sort Whitelist Security Utility
 * -------------------------------
 * Maps user-supplied `sortBy` parameters against a strict server-side whitelist.
 * Prevents SQL injection, field exposure, and invalid column query errors.
 */
function sanitizeSortField(requestedField, whitelist, defaultColumn) {
    if (!requestedField) {
        return defaultColumn;
    }
    return whitelist[requestedField] ?? defaultColumn;
}
/**
 * Validates and normalizes sort order ('asc' | 'desc').
 */
function sanitizeSortOrder(requestedOrder, defaultOrder = 'asc') {
    if (!requestedOrder) {
        return defaultOrder;
    }
    const lower = requestedOrder.toLowerCase();
    return lower === 'desc' ? 'desc' : 'asc';
}
//# sourceMappingURL=sort-whitelist.js.map