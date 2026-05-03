import { createContext, useContext } from 'react';

/** Lightweight context so views can trigger settings open/close. */
export const AppContext = createContext({ openSettings: () => {}, closeSettings: () => {} });
export const useApp = () => useContext(AppContext);
