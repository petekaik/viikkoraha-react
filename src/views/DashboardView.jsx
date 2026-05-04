import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGoogleSheets } from '../hooks/useGoogleSheets';
import { useUsers } from '../hooks/useUsers';
import { ROLES } from '../utils/sheets-schema';
import { useTranslation } from '../i18n/useTranslation';
import LoginPrompt from '../components/LoginPrompt';
import OnboardingGuide from '../components/OnboardingGuide';
import DashboardSummary from '../components/DashboardSummary';
import WeeklyChart from '../components/WeeklyChart';
import HistoryList from '../components/HistoryList';
import NotificationBar from '../components/NotificationBar';

const AUTO_REFRESH_MS = 30_000;

export default function DashboardView() {
  const { t } = useTranslation();
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const spreadsheetId = useSettingsStore((s) => s.spreadsheetId);
  const { login, isLoading: authLoading, error: authError, gapiReady } = useGoogleAuth();
  const { getSummary, getBookings, updateStatus, deleteBooking, isLoading, error, clearError } =
    useGoogleSheets();
  const { getUsers } = useUsers();

  const [summary, setSummary] = useState({ pending: 0, totalPaid: 0 });
  const [allBookings, setAllBookings] = useState([]);
  const [notification, setNotification] = useState(null);
  const [dismissedError, setDismissedError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedChild, setSelectedChild] = useState('__all__');
  const [children, setChildren] = useState([]);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'chart'
  const loaded = useRef(false);
  const lastSheetId = useRef('');
  const pullStartY = useRef(0);
  const pulling = useRef(false);
  const containerRef = useRef(null);

  const isParent = role === ROLES.PARENT;

  const loadChildren = useCallback(async () => {
    if (!isParent || !spreadsheetId) return;
    try {
      const users = await getUsers();
      const kids = users.filter((u) => u.role === ROLES.CHILD);
      setChildren(kids);
      if (selectedChild !== '__all__' && !kids.find((k) => k.email === selectedChild)) {
        setSelectedChild('__all__');
      }
    } catch { /* ignore */ }
  }, [isParent, spreadsheetId, getUsers, selectedChild]);

  useEffect(() => { loadChildren(); }, [loadChildren]);

  const loadData = useCallback(async () => {
    if (!spreadsheetId) return;
    loaded.current = true;
    lastSheetId.current = spreadsheetId;
    try {
      const [s, b] = await Promise.all([getSummary(), getBookings()]);
      if (s) setSummary(s);
      if (b) setAllBookings(b);
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
  }, [isSignedIn, gapiReady, spreadsheetId, loadData]);

  useEffect(() => {
    if (!isSignedIn || !gapiReady || !spreadsheetId) return;
    const timer = setInterval(() => {
      loadData();
      loadChildren();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [isSignedIn, gapiReady, spreadsheetId, loadData, loadChildren]);

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
      Promise.all([loadData(), loadChildren()]).finally(() => setRefreshing(false));
    }
  }

  function handleTouchEnd() { pulling.current = false; }

  const visibleBookings = useCallback(() => {
    if (isParent && selectedChild === '__all__') return allBookings;
    if (isParent) return allBookings.filter(
      (b) => b.userName?.toLowerCase() === children.find(c => c.email === selectedChild)?.name?.toLowerCase()
    );
    return allBookings.filter((b) => b.userName === user?.name);
  }, [allBookings, isParent, selectedChild, children, user?.name]);

  const visibleSummary = useCallback(() => {
    const bookings = visibleBookings();
    let pending = 0, totalPaid = 0;
    for (const b of bookings) {
      if (b.status === 'paid') totalPaid += b.value;
      else if (b.status === 'pending') pending += b.value;
    }
    return { pending, totalPaid };
  }, [visibleBookings]);

  async function handleApprove(rowIndex) {
    const payerName = user?.name || 'Tuntematon';
    try {
      await updateStatus(rowIndex, 'paid', payerName);
      setNotification({ type: 'success', message: t('ui.dashboard.chorePaid') });
      loaded.current = false;
      await loadData();
    } catch {
      setNotification({ type: 'error', message: t('ui.dashboard.approveFailed') });
    }
  }

  async function handleReject(rowIndex) {
    const payerName = user?.name || 'Tuntematon';
    try {
      await updateStatus(rowIndex, 'rejected', payerName);
      setNotification({ type: 'info', message: t('ui.dashboard.choreRejected') });
      loaded.current = false;
      await loadData();
    } catch {
      setNotification({ type: 'error', message: t('ui.dashboard.rejectFailed') });
    }
  }

  async function handleUnpay(rowIndex) {
    try {
      await updateStatus(rowIndex, 'pending', '');
      setNotification({ type: 'info', message: t('ui.dashboard.choreUnpaid') });
      loaded.current = false;
      await loadData();
    } catch {
      setNotification({ type: 'error', message: t('ui.dashboard.unpayFailed') });
    }
  }

  async function handleDelete(rowIndex) {
    try {
      await deleteBooking(rowIndex);
      setNotification({ type: 'success', message: t('ui.dashboard.choreDeleted') });
      loaded.current = false;
      await loadData();
    } catch {
      setNotification({ type: 'error', message: t('ui.dashboard.deleteFailed') });
    }
  }

  const summaryData = visibleSummary();
  const bookingList = visibleBookings();

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
        {error && !dismissedError && (
          <NotificationBar
            message={error}
            type="error"
            onClose={() => { clearError?.(); setDismissedError(true); }}
          />
        )}

        {/* Child selector for parents */}
        {isParent && children.length > 0 && (
          <div className="mb-3">
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="__all__">{t('ui.dashboard.allChildren')}</option>
              {children.map((c) => (
                <option key={c.email} value={c.email}>{c.name || c.email}</option>
              ))}
            </select>
          </div>
        )}

        <DashboardSummary pending={summaryData.pending} totalPaid={summaryData.totalPaid} />

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mt-4 mb-3">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === 'summary'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {t('ui.dashboard.summary')}
          </button>
          <button
            onClick={() => setActiveTab('chart')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === 'chart'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {t('ui.dashboard.chart')}
          </button>
        </div>

        {activeTab === 'summary' ? (
          <>
            <h2 className="text-lg font-semibold text-gray-300 mb-2">{t('ui.dashboard.taskHistory')}</h2>
            {isLoading && allBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">{t('ui.dashboard.loading')}</p>
              </div>
            ) : (
              <HistoryList
                bookings={bookingList}
                onApprove={isParent ? handleApprove : undefined}
                onReject={isParent ? handleReject : undefined}
                onUnpay={isParent ? handleUnpay : undefined}
                onDelete={isParent ? handleDelete : undefined}
                userName={user?.name}
              />
            )}
          </>
        ) : (
          <div className="bg-gray-800 rounded-xl p-4">
            <WeeklyChart bookings={bookingList} />
          </div>
        )}
      </div>
    </div>
  );
}
