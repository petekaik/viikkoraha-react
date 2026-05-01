import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useChoresStore } from '../stores/choresStore';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGoogleSheets } from '../hooks/useGoogleSheets';
import LoginPrompt from '../components/LoginPrompt';
import ChoreList from '../components/ChoreList';
import ConfirmDialog from '../components/ConfirmDialog';
import NotificationBar from '../components/NotificationBar';

export default function HomeView() {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const { login, isLoading: authLoading, error: authError, gapiReady } = useGoogleAuth();
  const { getChores, appendBooking, isLoading: sheetsLoading, error: sheetsError, clearError } =
    useGoogleSheets();
  const spreadsheetId = useSettingsStore((s) => s.spreadsheetId);
  const chores = useChoresStore((s) => s.chores);
  const setChores = useChoresStore((s) => s.setChores);

  const [selectedChore, setSelectedChore] = useState(null);
  const [notification, setNotification] = useState(null);
  const [dismissedError, setDismissedError] = useState(false);
  const loaded = useRef(false);
  const lastSheetId = useRef('');

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

  async function handleConfirm() {
    if (!selectedChore) return;
    try {
      await appendBooking(selectedChore.id, selectedChore.description, selectedChore.value);
      setNotification({ type: 'success', message: `Viikkorahaa lisätty: ${selectedChore.displayName}` });
    } catch {
      setNotification({ type: 'error', message: 'Lisäys epäonnistui' });
    }
    setSelectedChore(null);
  }

  function handleCancel() {
    setSelectedChore(null);
  }

  if (!isSignedIn) {
    return <LoginPrompt onLogin={login} isLoading={authLoading} error={authError} />;
  }

  return (
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

      {!spreadsheetId ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-3">⚙️</p>
          <p className="text-gray-400">Avaa asetukset ja syötä Spreadsheet ID tai luo uusi</p>
        </div>
      ) : !gapiReady || (!loaded.current && sheetsLoading) ? (
        <p className="text-center text-gray-500 py-12">Ladataan askareita...</p>
      ) : sheetsError && !loaded.current ? (
        <div className="text-center py-16">
          <p className="text-red-400 mb-2">⚠️</p>
          <p className="text-red-400 mb-3">Askareiden lataus epäonnistui</p>
          <button
            onClick={() => { loaded.current = false; setDismissedError(false); clearError?.(); loadChores(); }}
            className="text-blue-400 underline text-sm"
          >
            Yritä uudelleen
          </button>
        </div>
      ) : (
        <ChoreList chores={chores} onSelect={(chore) => setSelectedChore(chore)} />
      )}
      {selectedChore && (
        <ConfirmDialog
          chore={selectedChore}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
