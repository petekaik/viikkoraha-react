import { useCallback, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import {
  CHORES_RANGE, BOOKINGS_RANGE, SUMS_RANGE, SETTINGS_RANGE, DEFAULT_CHORES
} from '../utils/sheets-schema';
import { isGapiReady } from './useGoogleAuth';

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

  // ── Existing operations ──

  const getChores = useCallback(() =>
    call(async () => {
      const res = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId, range: CHORES_RANGE,
      });
      const rows = res.result.values || [];
      return rows.map(([id, description, value, displayName]) => ({
        id, description: description || id,
        value: parseFloat(value) || 0,
        displayName: displayName || id,
      }));
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
        value: parseFloat(row[3]) || 0,
        weekNumber: row[4],
        userName: row[5] || '',
        status: row[6] || 'pending',
        rowIndex: i,
      })).reverse();
    }),
  [spreadsheetId, call]);

  const appendBooking = useCallback((choreId, description, value) =>
    call(async () => {
      const userName = user?.name || 'Tuntematon';
      const weekNumber = getISOWeek();
      await window.gapi.client.sheets.spreadsheets.values.append(
        {
          spreadsheetId, range: 'Bookings!A2:G',
          valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS',
        },
        {
          values: [[
            new Date().toISOString(), choreId, description, value,
            weekNumber, userName, 'pending',
          ]],
        },
      );
    }),
  [spreadsheetId, user, call]);

  const updateStatus = useCallback((rowIndex, paidBy) =>
    call(async () => {
      const sheetRow = rowIndex + 2;
      await window.gapi.client.sheets.spreadsheets.values.update(
        {
          spreadsheetId, range: `Bookings!G${sheetRow}:H${sheetRow}`,
          valueInputOption: 'USER_ENTERED',
        },
        { values: [['paid', paidBy]] },
      );
    }),
  [spreadsheetId, call]);

  const getSummary = useCallback(() =>
    call(async () => {
      const res = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId, range: SUMS_RANGE,
      });
      const rows = res.result.values || [];
      return {
        pending: parseFloat(rows[0]?.[1]) || 0,
        totalPaid: parseFloat(rows[1]?.[1]) || 0,
      };
    }),
  [spreadsheetId, call]);

  const initSheets = useCallback(() =>
    call(async () => {
      const meta = await window.gapi.client.sheets.spreadsheets.get({ spreadsheetId });
      const existingSheets = (meta.result.sheets || []).map((s) =>
        s.properties.title.toLowerCase());
      const created = [];

      if (!existingSheets.includes('chores')) {
        await window.gapi.client.sheets.spreadsheets.batchUpdate(
          { spreadsheetId },
          { requests: [{ addSheet: { properties: { title: 'Chores' } } }] },
        );
        const rows = [['ID', 'Description', 'Value', 'DisplayName']];
        for (const c of DEFAULT_CHORES) rows.push([c.id, c.description, c.value, c.displayName]);
        await window.gapi.client.sheets.spreadsheets.values.update(
          { spreadsheetId, range: 'Chores!A1:D', valueInputOption: 'USER_ENTERED' },
          { values: rows },
        );
        created.push('Chores');
      }

      if (!existingSheets.includes('bookings')) {
        await window.gapi.client.sheets.spreadsheets.batchUpdate(
          { spreadsheetId },
          { requests: [{ addSheet: { properties: { title: 'Bookings' } } }] },
        );
        await window.gapi.client.sheets.spreadsheets.values.update(
          { spreadsheetId, range: 'Bookings!A1:G', valueInputOption: 'USER_ENTERED' },
          { values: [['Timestamp', 'ChoreID', 'Description', 'Value', 'WeekNumber', 'UserName', 'Status']] },
        );
        created.push('Bookings');
      }

      if (!existingSheets.includes('sums')) {
        await window.gapi.client.sheets.spreadsheets.batchUpdate(
          { spreadsheetId },
          { requests: [{ addSheet: { properties: { title: 'Sums' } } }] },
        );
        await window.gapi.client.sheets.spreadsheets.values.update(
          { spreadsheetId, range: 'Sums!A1:B', valueInputOption: 'USER_ENTERED' },
          {
            values: [
              ['Pending', '=SUMIF(Bookings!G2:G; "pending"; Bookings!D2:D)'],
              ['Paid', '=SUMIF(Bookings!G2:G; "paid"; Bookings!D2:D)'],
            ],
          },
        );
        created.push('Sums');
      }

      // Also ensure Settings sheet exists
      if (!existingSheets.includes('settings')) {
        await ensureSettingsSheet();
        created.push('Settings');
        // Save initial settings to the newly created sheet
        await saveSettings();
      }

      return { created };
    }),
  [spreadsheetId, call, ensureSettingsSheet, saveSettings]);

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
        { spreadsheetId: newId, range: 'Bookings!A1:G', valueInputOption: 'USER_ENTERED' },
        { values: [['Timestamp', 'ChoreID', 'Description', 'Value', 'WeekNumber', 'UserName', 'Status']] },
      );

      // Sums
      await window.gapi.client.sheets.spreadsheets.values.update(
        { spreadsheetId: newId, range: 'Sums!A1:B', valueInputOption: 'USER_ENTERED' },
        {
          values: [
            ['Pending', '=SUMIF(Bookings!G2:G; "pending"; Bookings!D2:D)'],
            ['Paid', '=SUMIF(Bookings!G2:G; "paid"; Bookings!D2:D)'],
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

      return { spreadsheetId: newId, sheetsUrl: `https://docs.google.com/spreadsheets/d/${newId}` };
    }),
  [call]);

  return {
    getChores, getBookings, appendBooking, updateStatus, getSummary, initSheets,
    createNewSpreadsheet, clearError,
    loadSettings, saveSettings, ensureSettingsSheet,
    isLoading, error,
  };
}
