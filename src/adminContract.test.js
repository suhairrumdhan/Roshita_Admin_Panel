import {describe, expect, it} from 'vitest';
import {ADMIN_LISTS, ADMIN_PAGE_SIZE, ADMIN_ROUTES, normalizeSearch, validCoordinates} from './adminContract';

describe('admin panel input and navigation contracts', () => {
  it('keeps paging bounded and exposes expected protected routes', () => {
    expect(ADMIN_PAGE_SIZE).toBe(50);
    expect(ADMIN_LISTS).toContain('audit');
    expect(ADMIN_ROUTES).toContain('/audit');
    expect(ADMIN_ROUTES).toContain('/requests');
  });

  it('normalizes Arabic/Unicode search input consistently', () => {
    expect(normalizeSearch('  دواء   ABC  ')).toBe('دواء abc');
    expect(normalizeSearch(null)).toBe('');
  });

  it.each([[0, 0], [90, 180], [-90, -180]])('accepts in-range coordinates %s,%s', (lat, lng) => {
    expect(validCoordinates(lat, lng)).toBe(true);
  });

  it.each([[91, 0], [0, 181], [NaN, 0], ['1', 1], [Infinity, 1]])('rejects invalid coordinates %s,%s', (lat, lng) => {
    expect(validCoordinates(lat, lng)).toBe(false);
  });
});
