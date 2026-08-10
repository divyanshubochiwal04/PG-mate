import { describe, expect, it } from 'vitest';
import { buildPaginationMeta } from '../pagination/pagination.contract';

describe('@m-square/contracts - buildPaginationMeta', () => {
  it('should calculate pages and bounds correctly', () => {
    const meta = buildPaginationMeta(45, 1, 10);
    expect(meta.total).toBe(45);
    expect(meta.page).toBe(1);
    expect(meta.pageSize).toBe(10);
    expect(meta.totalPages).toBe(5);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrevious).toBe(false);
  });

  it('should handle last page correctly', () => {
    const meta = buildPaginationMeta(45, 5, 10);
    expect(meta.page).toBe(5);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrevious).toBe(true);
  });

  it('should enforce min page 1 and max pageSize 100', () => {
    const meta = buildPaginationMeta(200, -2, 500);
    expect(meta.page).toBe(1);
    expect(meta.pageSize).toBe(100);
  });

  it('should handle zero total items gracefully', () => {
    const meta = buildPaginationMeta(0, 1, 20);
    expect(meta.total).toBe(0);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrevious).toBe(false);
  });
});
