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
export declare function buildPaginationMeta(total: number, page?: number, pageSize?: number): PaginationMeta;
export declare function calculatePaginationBounds(page?: number, pageSize?: number): {
    offset: number;
    limit: number;
};
export declare function createPaginatedResult<T>(items: T[], total: number, page?: number, pageSize?: number): PaginatedResult<T>;
//# sourceMappingURL=pagination.contract.d.ts.map