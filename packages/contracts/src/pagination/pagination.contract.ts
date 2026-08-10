/**
 * Framework-neutral pagination query parameters interface.
 * Mobile apps and API services consume this interface directly.
 */
export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type PaginationParams = PaginationQuery;

/**
 * Metadata for paginated list responses.
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Standard paginated response envelope interface.
 */
export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Helper utility to build structured pagination metadata.
 */
export function buildPaginationMeta(total: number, page = 1, pageSize = 20): PaginationMeta {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, Math.min(100, pageSize));
  const totalPages = Math.ceil(total / safePageSize) || 1;

  return {
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrevious: safePage > 1,
  };
}

export function calculatePaginationBounds(
  page = 1,
  pageSize = 20
): { offset: number; limit: number } {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, Math.min(100, pageSize));
  return {
    offset: (safePage - 1) * safePageSize,
    limit: safePageSize,
  };
}

export function createPaginatedResult<T>(
  items: T[],
  total: number,
  page = 1,
  pageSize = 20
): PaginatedResult<T> {
  return {
    items,
    pagination: buildPaginationMeta(total, page, pageSize),
  };
}
