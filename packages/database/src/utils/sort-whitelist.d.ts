/**
 * Sort Whitelist Security Utility
 * -------------------------------
 * Maps user-supplied `sortBy` parameters against a strict server-side whitelist.
 * Prevents SQL injection, field exposure, and invalid column query errors.
 */
export declare function sanitizeSortField<T extends Record<string, string>>(requestedField: string | undefined, whitelist: T, defaultColumn: string): string;
/**
 * Validates and normalizes sort order ('asc' | 'desc').
 */
export declare function sanitizeSortOrder(requestedOrder: string | undefined, defaultOrder?: 'asc' | 'desc'): 'asc' | 'desc';
//# sourceMappingURL=sort-whitelist.d.ts.map