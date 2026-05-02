import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { AppContext } from '../utils/AppContext';
import SettingsPanel from './SettingsPanel';

export default function AppShell({ children }) {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const isHome = location.hash === '#/' || (!location.hash && location.pathname !== '/dashboard');

  return (
    <div className="min-h-screen max-w-lg mx-auto relative">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={showSettings ? 'Sulje asetukset' : 'Asetukset'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <div className="text-center">
            <h1 className="text-lg font-bold text-white">Viikkoraha</h1>
            {isSignedIn && user?.name && (
              <p className="text-xs text-gray-500 truncate max-w-[160px]">
                {user.name}
              </p>
            )}
          </div>

          <button
            onClick={() => navigate(isHome ? '/dashboard' : '/')}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={isHome ? 'Dashboard' : 'Koti'}
          >
            {isHome ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Settings overlay */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 bg-gray-900 overflow-y-auto"
          style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}
        >
          <div className="max-w-lg mx-auto p-4">
            <SettingsPanel />
            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-medium transition-colors"
            >
              Sulje asetukset
            </button>
          </div>
        </div>
      )}

      {/* Main content — expose openSettings to children */}
      <main className="pb-8">
        <AppContext.Provider value={{ openSettings: () => setShowSettings(true) }}>
          {children}
        </AppContext.Provider>
      </main>
    </div>
  );
}
