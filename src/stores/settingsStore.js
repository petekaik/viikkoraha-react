import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SPREADSHEET_ID } from '../utils/sheets-schema';

/**
 * Robust localStorage wrapper that never throws and logs failures
 * so we can catch PWA storage issues in production.
 */
function safeGet(key) {
  try {
    const val = localStorage.getItem(key);
    return val;
  } catch (e) {
    console.error('[viikkoraha] localStorage.getItem failed:', e);
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error('[viikkoraha] localStorage.setItem failed:', e);
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error('[viikkoraha] localStorage.removeItem failed:', e);
  }
}

/** Default values from build-time env (Vite exposes VITE_ prefixed vars). */
const DEFAULT_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const DEFAULT_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      clientId: DEFAULT_CLIENT_ID,
      apiKey: DEFAULT_API_KEY,
      spreadsheetId: DEFAULT_SPREADSHEET_ID,
      _lastSheetSync: null,

      setClientId: (id) => set({ clientId: id }),
      setApiKey: (key) => set({ apiKey: key }),
      setSpreadsheetId: (id) => set({ spreadsheetId: id }),

      setAllFromObject: (obj) =>
        set({
          clientId: obj.clientId ?? '',
          apiKey: obj.apiKey ?? '',
          spreadsheetId: obj.spreadsheetId ?? DEFAULT_SPREADSHEET_ID,
        }),

      /** Apply settings loaded from sheet (key-value map). */
      syncFromSheet: (map) => {
        const s = get();
        const merged = {
          clientId: map.clientId || s.clientId,
          apiKey: map.apiKey || s.apiKey,
          spreadsheetId: map.spreadsheetId || s.spreadsheetId,
          _lastSheetSync: Date.now(),
        };
        set(merged);
        // localStorage sync
        safeSet('viikkoraha-settings', JSON.stringify({
          state: {
            clientId: merged.clientId,
            apiKey: merged.apiKey,
            spreadsheetId: merged.spreadsheetId,
          },
          version: 0,
        }));
      },

      /** Return settings as key-value rows for sheet upload. */
      toSheetRows: () => {
        const s = get();
        return [
          ['clientId', s.clientId],
          ['apiKey', s.apiKey],
          ['spreadsheetId', s.spreadsheetId],
        ];
      },

      clear: () => {
        set({ clientId: '', apiKey: '', spreadsheetId: DEFAULT_SPREADSHEET_ID, _lastSheetSync: null });
        safeRemove('viikkoraha-settings');
      },

      /** Check if all settings are filled. Use as a function, not a getter. */
      checkReady: () => {
        const s = get();
        return Boolean(s.clientId && s.apiKey && s.spreadsheetId);
      },
    }),
    {
      name: 'viikkoraha-settings',
      storage: {
        getItem: safeGet,
        setItem: safeSet,
        removeItem: safeRemove,
      },
      // Don't persist _lastSheetSync
      partialize: (state) => ({
        clientId: state.clientId,
        apiKey: state.apiKey,
        spreadsheetId: state.spreadsheetId,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[viikkoraha] Settings rehydration failed:', error);
        }
      },
    },
  ),
);
