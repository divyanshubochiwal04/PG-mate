/**
 * Recursively redacts sensitive keys from any value.
 * Uses a WeakSet to detect and break circular references safely.
 * Exported for direct unit testing.
 */
export declare function redactSensitiveData(obj: any, visited?: WeakSet<object>): any;
//# sourceMappingURL=redact.d.ts.map