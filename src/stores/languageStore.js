import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const SUPPORTED_LANGUAGES = ['fi', 'se', 'en'];

const storage = {
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      localStorage.removeItem(name);
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, JSON.stringify(value));
    } catch (e) {
      // noop
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch (e) {
      // noop
    }
  },
};

export const useLanguageStore = create(
  persist(
    (set) => ({
      language: 'fi',
      setLanguage: (lang) => {
        if (SUPPORTED_LANGUAGES.includes(lang)) {
          set({ language: lang });
        }
      },
    }),
    {
      name: 'viikkoraha-language',
      storage,
    },
  ),
);
