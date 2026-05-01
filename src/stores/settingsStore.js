import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
        safeRemove('viikkoraha-settings');
      },

      get isReady() {
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
      // On rehydration failure, keep defaults but log it
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[viikkoraha] Settings rehydration failed:', error);
        }
      },
    },
  ),
);
