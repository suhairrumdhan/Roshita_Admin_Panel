// ADM-T01: keep list size and calendar semantics aligned with admin-lists.js.
export const ADMIN_PAGE_SIZE = 50;
export const ADMIN_TIME_ZONE = 'Africa/Tripoli';
export const DAY_MS = 24 * 60 * 60 * 1000;
export const ADMIN_ROUTES = ['/', '/requests', '/pharmacies', '/users', '/orders', '/alerts', '/coverage', '/reports', '/notifications', '/audit'];
export const ADMIN_LISTS = ['requests', 'pharmacies', 'users', 'orders', 'notifications', 'audit'];
export const normalizeSearch = value => String(value ?? '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
export function validCoordinates(latitude, longitude) {
  return typeof latitude === 'number' && typeof longitude === 'number' &&
    Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}
