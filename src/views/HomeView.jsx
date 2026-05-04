import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useChoresStore } from '../stores/choresStore';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGoogleSheets } from '../hooks/useGoogleSheets';
import { useTranslation } from '../i18n/useTranslation';
import LoginPrompt from '../components/LoginPrompt';
import OnboardingGuide from '../components/OnboardingGuide';
import ChoreList from '../components/ChoreList';
import ConfirmDialog from '../components/ConfirmDialog';
import NotificationBar from '../components/NotificationBar';

const AUTO_REFRESH_MS = 30_000;

export default function HomeView() {
  const { t } = useTranslation();
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const user = useAuthStore((s) => s.user);
  const { login, isLoading: authLoading, error: authError, gapiReady } = useGoogleAuth();
  const { getChores, appendBooking, isLoading: sheetsLoading, error: sheetsError, clearError } =
    useGoogleSheets();
  const spreadsheetId = useSettingsStore((s) => s.spreadsheetId);
  const chores = useChoresStore((s) => s.chores);
  const setChores = useChoresStore((s) => s.setChores);

  const [selectedChore, setSelectedChore] = useState(null);
  const [notification, setNotification] = useState(null);
  const [dismissedError, setDismissedError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loaded = useRef(false);
  const lastSheetId = useRef('');
  const pullStartY = useRef(0);
  const pulling = useRef(false);
  const containerRef = useRef(null);

  const loadChores = useCallback(async () => {
    if (!spreadsheetId) return;
    loaded.current = true;
    lastSheetId.current = spreadsheetId;
    try {
      const data = await getChores();
      if (data) setChores(data);
    } catch {
      // error handled via sheetsError
    }
  }, [getChores, spreadsheetId]);

  useEffect(() => {
    if (spreadsheetId !== lastSheetId.current) {
      loaded.current = false;
      setDismissedError(false);
    }
    if (isSignedIn && gapiReady && spreadsheetId && !loaded.current) {
      loadChores();
    }
  }, [isSignedIn, gapiReady, spreadsheetId]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!isSignedIn || !gapiReady || !spreadsheetId) return;
    const timer = setInterval(() => loadChores(), AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [isSignedIn, gapiReady, spreadsheetId, loadChores]);

  // Pull-to-refresh handlers
  function handleTouchStart(e) {
    if (containerRef.current?.scrollTop > 5) return;
    pullStartY.current = e.touches[0].clientY;
    pulling.current = true;
  }

  function handleTouchMove(e) {
    if (!pulling.current) return;
    const dy = e.touches[0].clientY - pullStartY.current;
    if (dy > 60) {
      pulling.current = false;
      setRefreshing(true);
      loadChores().finally(() => setRefreshing(false));
    }
  }

  function handleTouchEnd() { pulling.current = false; }

  async function handleConfirm() {
    if (!selectedChore) return;
    try {
      await appendBooking(selectedChore.id, selectedChore.description, selectedChore.value);
      setNotification({ type: 'success', message: `Viikkorahaa lisätty: ${selectedChore.displayName}` });
    } catch {
      setNotification({ type: 'error', message: t('ui.home.addFailed') });
    }
    setSelectedChore(null);
  }

  function handleCancel() {
    setSelectedChore(null);
  }

  if (!isSignedIn) {
    return <LoginPrompt onLogin={login} isLoading={authLoading} error={authError} />;
  }

  if (!spreadsheetId) {
    return <OnboardingGuide />;
  }

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto"
      style={{ height: 'calc(100vh - 56px)' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {refreshing && (
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-blue-400">
          <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          Päivitetään...
        </div>
      )}

      <div className="p-4 pt-2">
        {notification && (
          <NotificationBar
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
        {sheetsError && !dismissedError && (
          <NotificationBar
            message={sheetsError}
            type="error"
            onClose={() => { clearError?.(); setDismissedError(true); }}
          />
        )}

        {!gapiReady || (!loaded.current && sheetsLoading) ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">{t('ui.home.loading')}</p>
          </div>
        ) : sheetsError && !loaded.current ? (
          <div className="text-center py-16">
            <p className="text-red-400 mb-2">⚠️</p>
            <p className="text-red-400 mb-3">{t('ui.home.loadFailed')}</p>
            <button
              onClick={() => { loaded.current = false; setDismissedError(false); clearError?.(); loadChores(); }}
              className="text-blue-400 underline text-sm"
            >
              {t('ui.home.retry')}
            </button>
          </div>
        ) : (
          <ChoreList chores={chores} onSelect={(chore) => setSelectedChore(chore)} />
        )}
        {selectedChore && (
          <ConfirmDialog
            chore={selectedChore}
            user={user}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
}
