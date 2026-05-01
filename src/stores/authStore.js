import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Robust localStorage wrapper — same pattern as settingsStore.
 */
function safeGet(key) {
  try { return localStorage.getItem(key); } catch (e) {
    console.error('[viikkoraha] localStorage.getItem failed:', e); return null;
  }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {
    console.error('[viikkoraha] localStorage.setItem failed:', e);
  }
}
function safeRemove(key) {
  try { localStorage.removeItem(key); } catch (e) {
    console.error('[viikkoraha] localStorage.removeItem failed:', e);
  }
}

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isSignedIn: false,
      _hydrated: false,

      setToken: (token) => set({ accessToken: token, isSignedIn: Boolean(token) }),

      setUser: (user) => set({ user }),

      setSignedIn: (val) => set({ isSignedIn: val }),

      signOut: () => {
        set({ accessToken: null, user: null, isSignedIn: false });
      },

      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: 'viikkoraha-auth',
      storage: { getItem: safeGet, setItem: safeSet, removeItem: safeRemove },
      // Don't persist _hydrated — it's runtime-only
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isSignedIn: state.isSignedIn,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[viikkoraha] Auth rehydration failed:', error);
        }
        // Always mark as hydrated
        state?.setHydrated();
      },
    },
  ),
);
