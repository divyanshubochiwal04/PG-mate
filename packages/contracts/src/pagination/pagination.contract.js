"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaginationMeta = buildPaginationMeta;
exports.calculatePaginationBounds = calculatePaginationBounds;
exports.createPaginatedResult = createPaginatedResult;
/**
 * Helper utility to build structured pagination metadata.
 */
function buildPaginationMeta(total, page = 1, pageSize = 20) {
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
function calculatePaginationBounds(page = 1, pageSize = 20) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, Math.min(100, pageSize));
    return {
        offset: (safePage - 1) * safePageSize,
        limit: safePageSize,
    };
}
function createPaginatedResult(items, total, page = 1, pageSize = 20) {
    return {
        items,
        pagination: buildPaginationMeta(total, page, pageSize),
    };
}
//# sourceMappingURL=pagination.contract.js.map