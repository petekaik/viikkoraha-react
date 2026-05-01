import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGoogleSheets } from '../hooks/useGoogleSheets';
import LoginPrompt from '../components/LoginPrompt';
import DashboardSummary from '../components/DashboardSummary';
import HistoryList from '../components/HistoryList';
import NotificationBar from '../components/NotificationBar';

export default function DashboardView() {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const user = useAuthStore((s) => s.user);
  const spreadsheetId = useSettingsStore((s) => s.spreadsheetId);
  const { login, isLoading: authLoading, error: authError, gapiReady } = useGoogleAuth();
  const { getSummary, getBookings, updateStatus, isLoading, error, clearError } =
    useGoogleSheets();

  const [summary, setSummary] = useState({ pending: 0, totalPaid: 0 });
  const [bookings, setBookings] = useState([]);
  const [notification, setNotification] = useState(null);
  const [dismissedError, setDismissedError] = useState(false);
  const loaded = useRef(false);
  const lastSheetId = useRef('');

  const loadData = useCallback(async () => {
    if (!spreadsheetId) return;
    loaded.current = true;
    lastSheetId.current = spreadsheetId;
    try {
      const [s, b] = await Promise.all([getSummary(), getBookings()]);
      if (s) setSummary(s);
      if (b) setBookings(b);
    } catch { /* handled by hook */ }
  }, [getSummary, getBookings, spreadsheetId]);

  useEffect(() => {
    if (spreadsheetId !== lastSheetId.current) {
      loaded.current = false;
      setDismissedError(false);
    }
    if (isSignedIn && gapiReady && spreadsheetId && !loaded.current) {
      loadData();
    }
  }, [isSignedIn, gapiReady, spreadsheetId]);

  async function handleApprove(rowIndex) {
    const payerName = user?.name || 'Tuntematon';
    try {
      await updateStatus(rowIndex, payerName);
      setNotification({ type: 'success', message: 'Viikkorahatehtävä maksettu ✓' });
      loaded.current = false;
      await loadData();
    } catch {
      setNotification({ type: 'error', message: 'Kuittaus epäonnistui' });
    }
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
      {error && !dismissedError && (
        <NotificationBar
          message={error}
          type="error"
          onClose={() => { clearError?.(); setDismissedError(true); }}
        />
      )}
      <DashboardSummary pending={summary.pending} totalPaid={summary.totalPaid} />
      <h2 className="text-lg font-semibold text-gray-300 mb-2">Tehtävähistoria</h2>
      {!spreadsheetId ? (
        <p className="text-center text-gray-500 py-8">Syötä Spreadsheet ID asetuksista</p>
      ) : isLoading && bookings.length === 0 ? (
        <p className="text-center text-gray-500 py-8">Ladataan...</p>
      ) : (
        <HistoryList bookings={bookings} onApprove={handleApprove} userName={user?.name} />
      )}
    </div>
  );
}
