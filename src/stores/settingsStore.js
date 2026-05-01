import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const safeStorage = {
  getItem: (name) => {
    try { return localStorage.getItem(name); } catch { return null; }
  },
  setItem: (name, value) => {
    try { localStorage.setItem(name, value); } catch { /* noop */ }
  },
  removeItem: (name) => {
    try { localStorage.removeItem(name); } catch { /* noop */ }
  },
};

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      clientId: '',
      apiKey: '',
      spreadsheetId: '',

      setClientId: (id) => set({ clientId: id }),

      setApiKey: (key) => set({ apiKey: key }),

      setSpreadsheetId: (id) => set({ spreadsheetId: id }),

      setAllFromObject: (obj) =>
        set({
          clientId: obj.clientId ?? '',
          apiKey: obj.apiKey ?? '',
          spreadsheetId: obj.spreadsheetId ?? '',
        }),

      clear: () => {
        set({ clientId: '', apiKey: '', spreadsheetId: '' });
      },

      get isReady() {
        const s = get();
        return Boolean(s.clientId && s.apiKey && s.spreadsheetId);
      },
    }),
    {
      name: 'viikkoraha-settings',
      storage: safeStorage,
    },
  ),
);
