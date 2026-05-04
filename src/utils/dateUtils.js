/** ISO week helper for Viikkoraha.
 *  Returns "YYYY-Www" format (e.g. "2026-W18") so multi-year datasets sort correctly.
 *  The week number is zero-padded to two digits.
 */
export function getISOWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Format a week key ("2026-W18") for display: "2026 · Viikko 18" */
export function formatWeekLabel(weekKey, lang = 'fi') {
  const m = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!m) return weekKey;
  const labels = { fi: `Viikko ${m[2]}`, se: `Vecka ${m[2]}`, en: `Week ${m[2]}` };
  return `${m[1]} · ${labels[lang] || labels.fi}`;
}
