import { useCallback, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import {
  CHORES_RANGE, BOOKINGS_RANGE, SUMS_RANGE, SETTINGS_RANGE, DEFAULT_CHORES,
  USERS_HEADERS,
} from '../utils/sheets-schema';
import { isGapiReady } from './useGoogleAuth';
import { parseFinnishNumber } from '../utils/parseNumber';

import { getISOWeek } from '../utils/dateUtils';

export function useGoogleSheets() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const { apiKey, spreadsheetId } = useSettingsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const clearError = useCallback(() => setError(null), []);

  const call = useCallback(async (fn) => {
    if (!isGapiReady()) {
      throw new Error('Google API ei ole valmis. Odota hetki.');
    }
    if (!accessToken) {
      throw new Error('Et ole kirjautunut sisään.');
    }

    setIsLoading(true);
    setError(null);
    try {
      window.gapi.client.setToken({ access_token: accessToken });
      return await fn();
    } catch (err) {
      const status = err?.status || err?.code;
      if (status === 401 || status === 403) {
        const authMsg = 'Istunto vanhentui. Kirjaudu uudelleen.';
        setError(authMsg);
        useAuthStore.getState().signOut();
        throw new Error(authMsg);
      }
      let msg = 'Tuntematon virhe';
      if (err?.result?.error?.message) {
        msg = err.result.error.message;
      } else if (err?.body) {
        try { const p = JSON.parse(err.body); msg = p?.error?.message || msg; } catch {/* ignore */}
      } else if (err?.message) {
        msg = err.message;
      }
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // ── Settings sheet sync ──

  /** Load settings from Settings!A2:B and merge into settingsStore. */
  const loadSettings = useCallback(() =>
    call(async () => {
      const res = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: useSettingsStore.getState().spreadsheetId,
        range: SETTINGS_RANGE,
      });
      const rows = res.result.values || [];
      const map = {};
      for (const [key, val] of rows) {
        if (key) map[key] = val || '';
      }
      useSettingsStore.getState().syncFromSheet(map);
      return map;
    }),
  [call]);

  /** Save current settings from store to Settings!A2:B. */
  const saveSettings = useCallback(() =>
    call(async () => {
      const rows = useSettingsStore.getState().toSheetRows();
      // Ensure at least 6 rows so we don't shrink the range
      while (rows.length < 6) rows.push(['', '']);
      await window.gapi.client.sheets.spreadsheets.values.update(
        {
          spreadsheetId: useSettingsStore.getState().spreadsheetId,
          range: 'Settings!A2:B',
          valueInputOption: 'USER_ENTERED',
        },
        { values: rows },
      );
    }),
  [call]);

  /** Ensure Settings sheet exists. Safe to call multiple times. */
  const ensureSettingsSheet = useCallback(() =>
    call(async () => {
      const meta = await window.gapi.client.sheets.spreadsheets.get({
        spreadsheetId: useSettingsStore.getState().spreadsheetId,
      });
      const existing = (meta.result.sheets || []).map(s =>
        s.properties.title.toLowerCase());
      if (existing.includes('settings')) return;

      await window.gapi.client.sheets.spreadsheets.batchUpdate(
        { spreadsheetId: useSettingsStore.getState().spreadsheetId },
        { requests: [{ addSheet: { properties: { title: 'Settings' } } }] },
      );
      // Create header
      await window.gapi.client.sheets.spreadsheets.values.update(
        {
          spreadsheetId: useSettingsStore.getState().spreadsheetId,
          range: 'Settings!A1:B1',
          valueInputOption: 'USER_ENTERED',
        },
        { values: [['Key', 'Value']] },
      );
    }),
  [call]);

  /** List user's spreadsheets via Drive REST API (name + id). */
  const listSpreadsheets = useCallback(() =>
    call(async () => {
      const token = window.gapi.client.getToken();
      const res = await fetch(
        'https://www.googleapis.com/drive/v3/files?' + new URLSearchParams({
          q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
          orderBy: 'modifiedTime desc',
          pageSize: '50',
          fields: 'files(id,name,modifiedTime)',
        }),
        { headers: { Authorization: `Bearer ${token.access_token}` } },
      );
      if (!res.ok) {
        const body = await res.text();
        let detail = `${res.status}`;
        try {
          const parsed = JSON.parse(body);
          if (parsed?.error?.message) detail += `: ${parsed.error.message}`;
          // 403 "Drive API has not been used in project" → anna selkeä ohje
          if (parsed?.error?.message?.includes('has not been used')) {
            detail += ' — Aktivoi Drive API Google Cloud Consolessa: https://console.cloud.google.com/apis/library/drive.googleapis.com';
          }
        } catch { /* body ei ole JSON */ }
        if (res.status === 403 && detail.includes('has not been used')) {
          throw new Error(`Drive API ${detail}`);
        }
        throw new Error(
          `Drive API HTTP ${res.status} — tarkista ett\u00e4 Google-kirjautumisessa on hyv\u00e4ksytty Drive-lukuoikeus. Kirjaudu tarvittaessa ulos ja takaisin sis\u00e4\u00e4n. (${detail})`
        );
      }
      const data = await res.json();
      return (data.files || []).map(f => ({
        id: f.id,
        name: f.name,
        modifiedTime: f.modifiedTime,
      }));
    }),
  [call]);

  /** Validate that a spreadsheet has the required Viikkoraha tabs.
   *  Returns { valid, missing, name }  */
  const validateSpreadsheet = useCallback((id) =>
    call(async () => {
      const meta = await window.gapi.client.sheets.spreadsheets.get({ spreadsheetId: id });
      const title = meta.result.properties?.title || '';
      const existing = (meta.result.sheets || []).map(s => s.properties.title.toLowerCase());
      const required = ['chores', 'bookings', 'sums', 'settings'];
      const missing = required.filter(r => !existing.includes(r));
      return { valid: missing.length === 0, missing, name: title };
    }),
  [call]);

  // ── Existing operations ──

  const getChores = useCallback(() =>
    call(async () => {
      const res = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId, range: CHORES_RANGE,
      });
      const rows = res.result.values || [];
      return rows.map(([id, description, value, displayName], i) => ({
        id, description: description || id,
        value: parseFinnishNumber(value),
        displayName: displayName || id,
        rowIndex: i,
      }));
    }),
  [spreadsheetId, call]);

  // ── Chore CRUD (parent-only) ──

  const addChore = useCallback((id, description, value, displayName) =>
    call(async () => {
      await window.gapi.client.sheets.spreadsheets.values.append(
        { spreadsheetId, range: 'Chores!A2:D', valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS' },
        { values: [[id, description, value, displayName]] },
      );
    }),
  [spreadsheetId, call]);

  const updateChore = useCallback((rowIndex, id, description, value, displayName) =>
    call(async () => {
      const sheetRow = rowIndex + 2;
      await window.gapi.client.sheets.spreadsheets.values.update(
        { spreadsheetId, range: `Chores!A${sheetRow}:D${sheetRow}`, valueInputOption: 'USER_ENTERED' },
        { values: [[id, description, value, displayName]] },
      );
    }),
  [spreadsheetId, call]);

  const deleteChore = useCallback((rowIndex) =>
    call(async () => {
      const sheetRow = rowIndex + 2;
      // Get actual sheetId for Chores tab
      const meta = await window.gapi.client.sheets.spreadsheets.get({ spreadsheetId });
      const sheet = (meta.result.sheets || []).find(
        (s) => s.properties.title.toLowerCase() === 'chores',
      );
      if (!sheet) throw new Error('Chores-sivu puuttuu');
      await window.gapi.client.sheets.spreadsheets.batchUpdate(
        { spreadsheetId },
        {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: 'ROWS',
                startIndex: sheetRow - 1,
                endIndex: sheetRow,
              },
            },
          }],
        },
      );
    }),
  [spreadsheetId, call]);

  const getBookings = useCallback(() =>
    call(async () => {
      const res = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId, range: BOOKINGS_RANGE,
      });
      const rows = res.result.values || [];
      return rows.map((row, i) => ({
        timestamp: row[0],
        choreId: row[1],
        description: row[2] || row[1],
        value: parseFinnishNumber(row[3]),
        weekNumber: row[4],
        userName: row[5] || '',
        status: row[6] || 'pending',
        approvedBy: row[7] || '',
        approvedAt: row[8] || '',
        userEmail: row[9] || '',
        rowIndex: i,
      })).reverse();
    }),
  [spreadsheetId, call]);

  const appendBooking = useCallback((choreId, description, value) =>
    call(async () => {
      const userName = user?.name || 'Tuntematon';
      const userEmail = user?.email || '';
      const weekNumber = getISOWeek();
      await window.gapi.client.sheets.spreadsheets.values.append(
        {
          spreadsheetId, range: 'Bookings!A2:J',
          valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS',
        },
        {
          values: [[
            new Date().toISOString(), choreId, description, value,
            weekNumber, userName, 'pending', '', '', userEmail,
          ]],
        },
      );
    }),
  [spreadsheetId, user, call]);

  const updateStatus = useCallback((rowIndex, newStatus, approvedBy) =>
    call(async () => {
      const sheetRow = rowIndex + 2;
      const now = new Date().toISOString();
      await window.gapi.client.sheets.spreadsheets.values.update(
        {
          spreadsheetId, range: `Bookings!G${sheetRow}:I${sheetRow}`,
          valueInputOption: 'USER_ENTERED',
        },
        { values: [[newStatus, approvedBy || '', now]] },
      );
    }),
  [spreadsheetId, call]);

  const getSummary = useCallback(() =>
    call(async () => {
      // Compute sums directly from Bookings data — independent of Sums-sheet formula order
      const res = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId, range: BOOKINGS_RANGE,
      });
      const rows = res.result.values || [];
      let pending = 0;
      let totalPaid = 0;
      for (const row of rows) {
        const status = (row[6] || '').toLowerCase().trim();
        const val = parseFinnishNumber(row[3]);
        if (status === 'paid') totalPaid += val;
        else if (status === 'pending') pending += val;
        // 'rejected' rows are ignored — no money owed
      }
      return { pending, totalPaid };
    }),
  [spreadsheetId, call]);

  const initSheets = useCallback(() =>
    call(async () => {
      const sid = useSettingsStore.getState().spreadsheetId;
      if (!sid) throw new Error('Spreadsheet ID puuttuu');
      const meta = await window.gapi.client.sheets.spreadsheets.get({ spreadsheetId: sid });
      const existingSheets = (meta.result.sheets || []).map((s) =>
        s.properties.title.toLowerCase());
      const created = [];

      if (!existingSheets.includes('chores')) {
        await window.gapi.client.sheets.spreadsheets.batchUpdate(
          { spreadsheetId: sid },
          { requests: [{ addSheet: { properties: { title: 'Chores' } } }] },
        );
        const rows = [['ID', 'Description', 'Value', 'DisplayName']];
        for (const c of DEFAULT_CHORES) rows.push([c.id, c.description, c.value, c.displayName]);
        await window.gapi.client.sheets.spreadsheets.values.update(
          { spreadsheetId: sid, range: 'Chores!A1:D', valueInputOption: 'USER_ENTERED' },
          { values: rows },
        );
        created.push('Chores');
      }

      if (!existingSheets.includes('bookings')) {
        await window.gapi.client.sheets.spreadsheets.batchUpdate(
          { spreadsheetId: sid },
          { requests: [{ addSheet: { properties: { title: 'Bookings' } } }] },
        );
        await window.gapi.client.sheets.spreadsheets.values.update(
          { spreadsheetId: sid, range: 'Bookings!A1:J', valueInputOption: 'USER_ENTERED' },
          { values: [['Timestamp', 'ChoreID', 'Description', 'Value', 'WeekNumber', 'UserName', 'Status', 'ApprovedBy', 'ApprovedAt', 'UserEmail']] },
        );
        created.push('Bookings');
      }

      if (!existingSheets.includes('sums')) {
        await window.gapi.client.sheets.spreadsheets.batchUpdate(
          { spreadsheetId: sid },
          { requests: [{ addSheet: { properties: { title: 'Sums' } } }] },
        );
        await window.gapi.client.sheets.spreadsheets.values.update(
          { spreadsheetId: sid, range: 'Sums!A1:B', valueInputOption: 'USER_ENTERED' },
          {
            values: [
              ['Pending', '=SUMIF(Bookings!G:G; "pending"; Bookings!D:D)'],
              ['Paid', '=SUMIF(Bookings!G:G; "paid"; Bookings!D:D)'],
            ],
          },
        );
        created.push('Sums');
      }

      // Also ensure Settings sheet exists
      if (!existingSheets.includes('settings')) {
        await ensureSettingsSheet();
        created.push('Settings');
        await saveSettings();
      }

      // Also ensure Users sheet exists
      if (!existingSheets.includes('users')) {
        await window.gapi.client.sheets.spreadsheets.batchUpdate(
          { spreadsheetId: sid },
          { requests: [{ addSheet: { properties: { title: 'Users' } } }] },
        );
        await window.gapi.client.sheets.spreadsheets.values.update(
          { spreadsheetId: sid, range: 'Users!A1:C1', valueInputOption: 'USER_ENTERED' },
          { values: [USERS_HEADERS] },
        );
        created.push('Users');
      }

      return { created };
    }),
  [call, ensureSettingsSheet, saveSettings]);

  const createNewSpreadsheet = useCallback(() =>
    call(async () => {
      const createRes = await window.gapi.client.sheets.spreadsheets.create({
        properties: { title: 'Viikkoraha' },
      });
      const newId = createRes.result.spreadsheetId;
      const sheets = createRes.result.sheets || [];
      const existingTitles = sheets.map(s => s.properties.title.toLowerCase());

      const requests = [];
      if (existingTitles.includes('sheet1')) {
        const sheet1Id = sheets.find(s => s.properties.title.toLowerCase() === 'sheet1')?.properties.sheetId;
        if (sheet1Id != null) requests.push({ deleteSheet: { sheetId: sheet1Id } });
      }

      requests.push(
        { addSheet: { properties: { title: 'Chores' } } },
        { addSheet: { properties: { title: 'Bookings' } } },
        { addSheet: { properties: { title: 'Sums' } } },
        { addSheet: { properties: { title: 'Settings' } } },
        { addSheet: { properties: { title: 'Users' } } },
      );

      if (requests.length > 0) {
        await window.gapi.client.sheets.spreadsheets.batchUpdate(
          { spreadsheetId: newId }, { requests },
        );
      }

      // Populate Chores
      const choreRows = [['ID', 'Description', 'Value', 'DisplayName']];
      for (const c of DEFAULT_CHORES) choreRows.push([c.id, c.description, c.value, c.displayName]);
      await window.gapi.client.sheets.spreadsheets.values.update(
        { spreadsheetId: newId, range: 'Chores!A1:D', valueInputOption: 'USER_ENTERED' },
        { values: choreRows },
      );

      // Populate Bookings
      await window.gapi.client.sheets.spreadsheets.values.update(
        { spreadsheetId: newId, range: 'Bookings!A1:J', valueInputOption: 'USER_ENTERED' },
        { values: [['Timestamp', 'ChoreID', 'Description', 'Value', 'WeekNumber', 'UserName', 'Status', 'ApprovedBy', 'ApprovedAt', 'UserEmail']] },
      );

      // Sums
      await window.gapi.client.sheets.spreadsheets.values.update(
        { spreadsheetId: newId, range: 'Sums!A1:B', valueInputOption: 'USER_ENTERED' },
        {
          values: [
            ['Pending', '=SUMIF(Bookings!G:G; "pending"; Bookings!D:D)'],
            ['Paid', '=SUMIF(Bookings!G:G; "paid"; Bookings!D:D)'],
          ],
        },
      );

      // Settings header
      await window.gapi.client.sheets.spreadsheets.values.update(
        { spreadsheetId: newId, range: 'Settings!A1:B1', valueInputOption: 'USER_ENTERED' },
        { values: [['Key', 'Value']] },
      );

      // Save current settings
      const settingRows = useSettingsStore.getState().toSheetRows();
      while (settingRows.length < 6) settingRows.push(['', '']);
      await window.gapi.client.sheets.spreadsheets.values.update(
        { spreadsheetId: newId, range: 'Settings!A2:B', valueInputOption: 'USER_ENTERED' },
        { values: settingRows },
      );

      // Users header
      await window.gapi.client.sheets.spreadsheets.values.update(
        { spreadsheetId: newId, range: 'Users!A1:C1', valueInputOption: 'USER_ENTERED' },
        { values: [USERS_HEADERS] },
      );

      return { spreadsheetId: newId, sheetsUrl: `https://docs.google.com/spreadsheets/d/${newId}` };
    }),
  [call]);

  return {
    getChores, getBookings, appendBooking, updateStatus, getSummary, initSheets,
    addChore, updateChore, deleteChore,
    createNewSpreadsheet, clearError,
    loadSettings, saveSettings, ensureSettingsSheet,
    listSpreadsheets, validateSpreadsheet,
    isLoading, error,
  };
}
