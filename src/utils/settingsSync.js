/**
 * Settings ↔ Sheets sync utilities.
 * Raw GAPI calls — no React hooks dependency.
 * Used by useGoogleAuth (auto-load on login) and SettingsPanel (save on save).
 */
import { useSettingsStore } from '../stores/settingsStore';
import { SETTINGS_RANGE } from './sheets-schema';

/** Ensure Settings sheet exists in the spreadsheet. */
export async function ensureSettingsSheet(spreadsheetId) {
  const meta = await window.gapi.client.sheets.spreadsheets.get({ spreadsheetId });
  const existing = (meta.result.sheets || []).map(s => s.properties.title.toLowerCase());
  if (existing.includes('settings')) return;

  await window.gapi.client.sheets.spreadsheets.batchUpdate(
    { spreadsheetId },
    { requests: [{ addSheet: { properties: { title: 'Settings' } } }] },
  );
  await window.gapi.client.sheets.spreadsheets.values.update(
    { spreadsheetId, range: 'Settings!A1:B1', valueInputOption: 'USER_ENTERED' },
    { values: [['Key', 'Value']] },
  );
}

/** Load settings key-value map from Settings!A2:B → settingsStore. */
export async function loadSettingsFromSheet(spreadsheetId) {
  try {
    const res = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId, range: SETTINGS_RANGE,
    });
    const rows = res.result.values || [];
    const map = {};
    for (const [key, val] of rows) {
      if (key) map[key] = val || '';
    }
    // Only sync if we got something meaningful
    if (Object.keys(map).length > 0) {
      useSettingsStore.getState().syncFromSheet(map);
    }
    return map;
  } catch (e) {
    // Settings sheet might not exist yet — that's ok
    console.warn('[viikkoraha] loadSettingsFromSheet failed (sheet may be empty):', e.message);
    return {};
  }
}

/** Save current settingsStore to Settings!A2:B. */
export async function saveSettingsToSheet(spreadsheetId) {
  const rows = useSettingsStore.getState().toSheetRows();
  while (rows.length < 6) rows.push(['', '']);
  await window.gapi.client.sheets.spreadsheets.values.update(
    { spreadsheetId, range: 'Settings!A2:B', valueInputOption: 'USER_ENTERED' },
    { values: rows },
  );
}
