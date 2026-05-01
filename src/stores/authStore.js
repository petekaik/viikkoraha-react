import { create } from 'zustand';

const SESSION_KEY = 'viikkoraha-auth';

function loadFromSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return {
      accessToken: data.accessToken || null,
      user: data.user || null,
      isSignedIn: Boolean(data.accessToken),
    };
  } catch {
    return {};
  }
}

export const useAuthStore = create((set) => ({
  accessToken: null,
  user: null,
  isSignedIn: false,
  isLoading: true,

  ...loadFromSession(),

  setToken: (token) => {
    set({ accessToken: token, isSignedIn: Boolean(token) });
    if (token) {
      const current = loadFromSession();
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ accessToken: token, user: current.user }),
      );
    }
  },

  setUser: (user) => {
    set({ user });
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      const existing = raw ? JSON.parse(raw) : {};
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ ...existing, user }),
      );
    } catch {
      // ignore
    }
  },

  setSignedIn: (val) => set({ isSignedIn: val }),

  signOut: () => {
    sessionStorage.removeItem(SESSION_KEY);
    set({ accessToken: null, user: null, isSignedIn: false });
  },

  setLoading: (val) => set({ isLoading: val }),
}));
