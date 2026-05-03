import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Custom storage that serializes/deserializes JSON manually.
 * Zustand's persist middleware calls setItem(state) with a raw object -
 * the storage adapter MUST JSON.stringify it itself. If you just pass
 * through to localStorage without serializing, you get "[object Object]".
 */
const storage = {
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('[viikkoraha] authStore getItem failed:', e.message);
      localStorage.removeItem(name); // siivoa korruptoitunut data
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, JSON.stringify(value));
    } catch (e) {
      console.warn('[viikkoraha] authStore setItem failed:', e.message);
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch (e) {
      console.warn('[viikkoraha] authStore removeItem failed:', e.message);
    }
  },
};

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isSignedIn: false,
      role: null,

      setToken: (token) => set({ accessToken: token, isSignedIn: Boolean(token) }),
      setUser: (user) => set({ user }),
      setSignedIn: (val) => set({ isSignedIn: val }),
      setRole: (role) => set({ role }),
      signOut: () => set({ accessToken: null, user: null, isSignedIn: false, role: null }),
    }),
    {
      name: 'viikkoraha-auth',
      storage,
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isSignedIn: state.isSignedIn,
        role: state.role,
      }),
    },
  ),
);
