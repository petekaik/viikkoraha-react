import { createContext, useContext } from 'react';

/** Lightweight context so views can trigger settings open from onboarding cards. */
export const AppContext = createContext({ openSettings: () => {} });
export const useApp = () => useContext(AppContext);
