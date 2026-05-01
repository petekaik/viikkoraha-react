import { create } from 'zustand';

export const useChoresStore = create((set) => ({
  chores: [],
  bookings: [],
  summary: { pending: 0, totalPaid: 0 },
  isLoading: false,
  error: null,

  setChores: (chores) => set({ chores }),

  setBookings: (bookings) => set({ bookings }),

  setSummary: (summary) => set({ summary }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}));
