/**
 * Parse Finnish/European locale number strings to float.
 * Handles comma as decimal separator (0,5 → 0.5).
 * Safe for English locale too (0.5 → 0.5).
 */
export function parseFinnishNumber(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  // Replace comma decimal separator with dot, remove spaces (thousand separator)
  const normalized = String(str).replace(',', '.').replace(/\s/g, '');
  return parseFloat(normalized) || 0;
}
