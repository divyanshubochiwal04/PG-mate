/**
 * Sort Whitelist Security Utility
 * -------------------------------
 * Maps user-supplied `sortBy` parameters against a strict server-side whitelist.
 * Prevents SQL injection, field exposure, and invalid column query errors.
 */
export function sanitizeSortField<T extends Record<string, string>>(
  requestedField: string | undefined,
  whitelist: T,
  defaultColumn: string
): string {
  if (!requestedField) {
    return defaultColumn;
  }
  return whitelist[requestedField] ?? defaultColumn;
}

/**
 * Validates and normalizes sort order ('asc' | 'desc').
 */
export function sanitizeSortOrder(
  requestedOrder: string | undefined,
  defaultOrder: 'asc' | 'desc' = 'asc'
): 'asc' | 'desc' {
  if (!requestedOrder) {
    return defaultOrder;
  }
  const lower = requestedOrder.toLowerCase();
  return lower === 'desc' ? 'desc' : 'asc';
}
