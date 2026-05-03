import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SPREADSHEET_ID } from '../utils/sheets-schema';

const storage = {
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  },
  setItem: (name, value) => {
    try { localStorage.setItem(name, JSON.stringify(value)); } catch (e) {}
  },
  removeItem: (name) => {
    try { localStorage.removeItem(name); } catch (e) {}
  },
};

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

      syncFromSheet: (map) => {
        const s = get();
        set({
          clientId: map.clientId || s.clientId,
          apiKey: map.apiKey || s.apiKey,
          spreadsheetId: map.spreadsheetId || s.spreadsheetId,
          _lastSheetSync: Date.now(),
        });
      },

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
      },

      checkReady: () => {
        const s = get();
        return Boolean(s.clientId && s.apiKey && s.spreadsheetId);
      },
    }),
    {
      name: 'viikkoraha-settings',
      storage,
      partialize: (state) => ({
        clientId: state.clientId,
        apiKey: state.apiKey,
        spreadsheetId: state.spreadsheetId,
      }),
    },
  ),
);
