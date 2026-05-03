import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { isGapiReady } from '../hooks/useGoogleAuth';
import { USERS_RANGE, USERS_HEADERS } from '../utils/sheets-schema';

export function useUsers() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const spreadsheetId = useSettingsStore((s) => s.spreadsheetId);

  const call = useCallback(
    async (fn) => {
      if (!isGapiReady()) throw new Error('Google API ei ole valmis.');
      if (!accessToken) throw new Error('Et ole kirjautunut sisään.');
      window.gapi.client.setToken({ access_token: accessToken });
      return fn();
    },
    [accessToken],
  );

  /** Fetch all users from Users sheet. Returns [{email, name, role}] */
  const getUsers = useCallback(
    () =>
      call(async () => {
        try {
          const res = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId,
            range: USERS_RANGE,
          });
          const rows = res.result.values || [];
          return rows
            .filter((r) => r[0])
            .map(([email, name, role]) => ({ email: email.trim(), name, role: role || 'child' }));
        } catch {
          return []; // sheet doesn't exist yet
        }
      }),
    [spreadsheetId, call],
  );

  /** Ensure Users sheet exists with headers. Safe to call multiple times. */
  const ensureUsersSheet = useCallback(
    () =>
      call(async () => {
        try {
          const meta = await window.gapi.client.sheets.spreadsheets.get({ spreadsheetId });
          const existing = (meta.result.sheets || []).map((s) => s.properties.title.toLowerCase());
          if (existing.includes('users')) return;
        } catch {
          // spreadsheet.get might fail — proceed with batchUpdate regardless
        }
        await window.gapi.client.sheets.spreadsheets.batchUpdate(
          { spreadsheetId },
          { requests: [{ addSheet: { properties: { title: 'Users' } } }] },
        );
        await window.gapi.client.sheets.spreadsheets.values.update(
          {
            spreadsheetId,
            range: 'Users!A1:C1',
            valueInputOption: 'USER_ENTERED',
          },
          { values: [USERS_HEADERS] },
        );
      }),
    [spreadsheetId, call],
  );

  /** Save user list to Users!A2:C. Overwrites existing data. */
  const saveUsers = useCallback(
    (users) =>
      call(async () => {
        await ensureUsersSheet();
        const rows = users.map((u) => [u.email, u.name, u.role]);
        // pad to avoid shrinking
        while (rows.length < 1) rows.push(['', '', '']);
        await window.gapi.client.sheets.spreadsheets.values.update(
          {
            spreadsheetId,
            range: 'Users!A2:C',
            valueInputOption: 'USER_ENTERED',
          },
          { values: rows },
        );
      }),
    [spreadsheetId, call, ensureUsersSheet],
  );

  return { getUsers, ensureUsersSheet, saveUsers };
}
