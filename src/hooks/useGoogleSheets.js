import { useCallback, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { CHORES_RANGE, BOOKINGS_RANGE, SUMS_RANGE, DEFAULT_CHORES } from '../utils/sheets-schema';
import { isGapiReady } from './useGoogleAuth';

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
      // Ensure token is current (GAPI init already handled by useGoogleAuth)
      window.gapi.client.setToken({ access_token: accessToken });
      return await fn();
    } catch (err) {
      // Detect auth errors (expired token, revoked, etc.)
      const status = err?.status || err?.code;
      if (status === 401 || status === 403) {
        const authMsg = 'Istunto vanhentui. Kirjaudu uudelleen.';
        setError(authMsg);
        useAuthStore.getState().signOut();
        throw new Error(authMsg);
      }

      // Extract the most useful error message
      let msg = 'Tuntematon virhe';
      if (err?.result?.error?.message) {
        msg = err.result.error.message;
      } else if (err?.body) {
        try {
          const parsed = JSON.parse(err.body);
          msg = parsed?.error?.message || msg;
        } catch { /* use default */ }
      } else if (err?.message) {
        msg = err.message;
      }
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const getChores = useCallback(() =>
    call(async () => {
      const res = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId, range: CHORES_RANGE,
      });
      const rows = res.result.values || [];
      return rows.map(([id, description, value, displayName]) => ({
        id,
        description: description || id,
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
      await window.gapi.client.sheets.spreadsheets.values.append(
        {
          spreadsheetId,
          range: 'Bookings!A2:G',
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
        },
        {
          values: [[
            new Date().toISOString(),
            choreId,
            description,
            value,
            '=WEEKNUM(LEFT(A:A,10), 2)',
            userName,
            'pending',
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
          spreadsheetId,
          range: `Bookings!G${sheetRow}:H${sheetRow}`,
          valueInputOption: 'USER_ENTERED',
        },
        {
          values: [['paid', paidBy]],
        },
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
        for (const c of DEFAULT_CHORES) {
          rows.push([c.id, c.description, c.value, c.displayName]);
        }
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
              ['Pending', '=SUMIF(Bookings!G2:G, "pending", Bookings!D2:D)'],
              ['Paid', '=SUMIF(Bookings!G2:G, "paid", Bookings!D2:D)'],
            ],
          },
        );
        created.push('Sums');
      }

      return { created };
    }),
  [spreadsheetId, call]);

  // Create BRAND NEW spreadsheet from scratch
  const createNewSpreadsheet = useCallback(() =>
    call(async () => {
      // 1. Create empty spreadsheet
      const createRes = await window.gapi.client.sheets.spreadsheets.create({
        properties: { title: 'Viikkoraha' },
      });
      const newId = createRes.result.spreadsheetId;
      const sheets = createRes.result.sheets || [];
      const existingTitles = sheets.map(s => s.properties.title.toLowerCase());

      // 2. Remove default "Sheet1" 
      const requests = [];
      if (existingTitles.includes('sheet1')) {
        const sheet1Id = sheets.find(s => s.properties.title.toLowerCase() === 'sheet1')?.properties.sheetId;
        if (sheet1Id != null) {
          requests.push({ deleteSheet: { sheetId: sheet1Id } });
        }
      }

      // 3. Create Chores sheet
      requests.push({ addSheet: { properties: { title: 'Chores' } } });
      requests.push({ addSheet: { properties: { title: 'Bookings' } } });
      requests.push({ addSheet: { properties: { title: 'Sums' } } });

      if (requests.length > 0) {
        await window.gapi.client.sheets.spreadsheets.batchUpdate(
          { spreadsheetId: newId },
          { requests },
        );
      }

      // 4. Populate Chores
      const choreRows = [['ID', 'Description', 'Value', 'DisplayName']];
      for (const c of DEFAULT_CHORES) {
        choreRows.push([c.id, c.description, c.value, c.displayName]);
      }
      await window.gapi.client.sheets.spreadsheets.values.update(
        { spreadsheetId: newId, range: 'Chores!A1:D', valueInputOption: 'USER_ENTERED' },
        { values: choreRows },
      );

      // 5. Populate Bookings header
      await window.gapi.client.sheets.spreadsheets.values.update(
        { spreadsheetId: newId, range: 'Bookings!A1:G', valueInputOption: 'USER_ENTERED' },
        { values: [['Timestamp', 'ChoreID', 'Description', 'Value', 'WeekNumber', 'UserName', 'Status']] },
      );

      // 6. Populate Sums with formulas
      await window.gapi.client.sheets.spreadsheets.values.update(
        { spreadsheetId: newId, range: 'Sums!A1:B', valueInputOption: 'USER_ENTERED' },
        {
          values: [
            ['Pending', '=SUMIF(Bookings!G2:G, "pending", Bookings!D2:D)'],
            ['Paid', '=SUMIF(Bookings!G2:G, "paid", Bookings!D2:D)'],
          ],
        },
      );

      return { spreadsheetId: newId, sheetsUrl: `https://docs.google.com/spreadsheets/d/${newId}` };
    }),
  [call]);

  return {
    getChores, getBookings, appendBooking, updateStatus, getSummary, initSheets,
    createNewSpreadsheet, clearError,
    isLoading, error,
  };
}
