/**
 * Safely format a date to only show YYYY-MM-DD or readable date (never shows timestamp/ISO time)
 * @param {string|Date} dateVal - E.g. '2026-11-13T18:30:00.000Z' or '2026-11-14'
 * @returns {string} - Clean date string like '2026-11-14'
 */
export function formatValidDate(dateVal) {
  if (!dateVal) return 'N/A';
  if (typeof dateVal === 'string') {
    // Strip time if present
    const datePart = dateVal.split('T')[0];
    return datePart;
  }
  if (dateVal instanceof Date) {
    const year = dateVal.getFullYear();
    const month = String(dateVal.getMonth() + 1).padStart(2, '0');
    const day = String(dateVal.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(dateVal);
}
