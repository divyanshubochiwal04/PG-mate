import { describe, expect, it } from 'vitest';
import { sanitizeSortField, sanitizeSortOrder } from '../utils/sort-whitelist';

describe('@m-square/database - Sort Whitelist Security Utility', () => {
  const WHITELIST = {
    createdAt: 'created_at',
    name: 'name',
    status: 'status',
  };

  it('should map valid whitelist keys to column names', () => {
    expect(sanitizeSortField('createdAt', WHITELIST, 'created_at')).toBe('created_at');
    expect(sanitizeSortField('name', WHITELIST, 'created_at')).toBe('name');
    expect(sanitizeSortField('status', WHITELIST, 'created_at')).toBe('status');
  });

  it('should fallback to default column for unknown or malicious sort keys', () => {
    // Attempted SQL injection via sort key
    expect(sanitizeSortField('name; DROP TABLE users; --', WHITELIST, 'created_at')).toBe(
      'created_at'
    );
    expect(sanitizeSortField('nonExistentField', WHITELIST, 'created_at')).toBe('created_at');
  });

  it('should fallback to default column when field is undefined', () => {
    expect(sanitizeSortField(undefined, WHITELIST, 'created_at')).toBe('created_at');
  });

  it('should sanitize sort order values to asc or desc', () => {
    expect(sanitizeSortOrder('desc')).toBe('desc');
    expect(sanitizeSortOrder('DESC')).toBe('desc');
    expect(sanitizeSortOrder('asc')).toBe('asc');
    expect(sanitizeSortOrder('ASC')).toBe('asc');
    expect(sanitizeSortOrder(undefined)).toBe('asc');
    expect(sanitizeSortOrder('invalid-order')).toBe('asc');
  });
});
