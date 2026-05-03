import { translations } from '../i18n/translations';

export const CHORES_RANGE = 'Chores!A2:D';
export const BOOKINGS_RANGE = 'Bookings!A2:I';
export const BOOKINGS_SHEET_RANGE = 'Bookings!A1:I';
export const SUMS_RANGE = 'Sums!A2:B';
export const SETTINGS_RANGE = 'Settings!A2:B';
export const USERS_RANGE = 'Users!A2:C';
export const DEFAULT_SPREADSHEET_ID = '';

export const CHORE_ICONS = {
  siivous: 'cleaning',
  tiskaus: 'dishes',
  ruoanlaitto: 'cooking',
  pyykki: 'laundry',
  roskat: 'recycle',
  ruokaostokset: 'groceries',
  posti: 'mail',
  vauva: 'baby',
};

export const ROLES = { PARENT: 'parent', CHILD: 'child' };

// DEPRECATED: kept for backwards compat with existing code. New code should use
// getDefaultChores() with a language argument.
export const DEFAULT_CHORES = [
  { id: 'siivous', description: 'Siivous', value: 2, displayName: 'Siivous' },
  { id: 'tiskaus', description: 'Tiskaus ja koneen tyhjennys', value: 1.5, displayName: 'Tiskaus' },
  { id: 'ruoanlaitto', description: 'Ruoanlaitto', value: 2, displayName: 'Ruoanlaitto' },
  { id: 'pyykki', description: 'Pykinpesu ja viikkaus', value: 1.5, displayName: 'Pyykki' },
  { id: 'roskat', description: 'Roskien vienti', value: 0.5, displayName: 'Roskat' },
  { id: 'ruokaostokset', description: 'Kauppaostokset', value: 1, displayName: 'Ruokaostokset' },
  { id: 'posti', description: 'Postin haku', value: 0.5, displayName: 'Posti' },
  { id: 'vauva', description: 'Vauvan hoito', value: 3, displayName: 'Vauva' },
];

export const CHORES_HEADERS = ['ID', 'Description', 'Value', 'DisplayName'];
export const BOOKINGS_HEADERS = [
  'Timestamp',
  'ChoreID',
  'Description',
  'Value',
  'UserName',
  'Status',
  'ApprovedBy',
  'ApprovedAt',
  'UserEmail',
];
export const SUMS_HEADERS = ['Type', 'Amount'];
export const USERS_HEADERS = ['Email', 'Name', 'Role'];

/**
 * Get default chores in the given language (fi/se/en).
 * Values are language-independent; descriptions/displayNames are translated.
 */
export function getDefaultChores(lang = 'fi') {
  const t = (translations[lang] || translations.fi);
  const chores = t.chores || translations.fi.chores;
  const values = {
    siivous: 2, tiskaus: 1.5, ruoanlaitto: 2, pyykki: 1.5,
    roskat: 0.5, ruokaostokset: 1, posti: 0.5, vauva: 3,
  };
  return Object.entries(chores).map(([id, c]) => ({
    id,
    value: values[id] || 0,
    description: c.description,
    displayName: c.displayName,
  }));
}

/** Get chore sheet headers in given language. */
export function getChoreHeaders(lang = 'fi') {
  const t = (translations[lang] || translations.fi);
  return t.choreHeaders || translations.fi.choreHeaders;
}

/** Get booking sheet headers in given language. */
export function getBookingHeaders(lang = 'fi') {
  const t = (translations[lang] || translations.fi);
  return t.bookingHeaders || translations.fi.bookingHeaders;
}

/** Get sum sheet headers in given language. */
export function getSumHeaders(lang = 'fi') {
  const t = (translations[lang] || translations.fi);
  return t.sumHeaders || translations.fi.sumHeaders;
}

/** Get user sheet headers in given language. */
export function getUserHeaders(lang = 'fi') {
  const t = (translations[lang] || translations.fi);
  return t.userHeaders || translations.fi.userHeaders;
}
