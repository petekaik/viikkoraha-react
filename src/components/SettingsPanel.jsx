import { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import { useGoogleSheets } from '../hooks/useGoogleSheets';
import { saveSettingsToSheet, ensureSettingsSheet } from '../utils/settingsSync';
import { validateClientId, validateApiKey } from '../utils/validation';
import NotificationBar from './NotificationBar';
import SpreadsheetPicker from './SpreadsheetPicker';

export default function SettingsPanel() {
  const { clientId, apiKey, spreadsheetId, setClientId, setApiKey, setSpreadsheetId, clear } =
    useSettingsStore();
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const signOut = useAuthStore((s) => s.signOut);
  const { initSheets, isLoading: sheetsLoading } = useGoogleSheets();

  const [form, setForm] = useState({ clientId: '', apiKey: '' });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  // Track selected spreadsheet name for display
  const [spreadsheetName, setSpreadsheetName] = useState('');

  useEffect(() => {
    setForm({ clientId, apiKey });
  }, [clientId, apiKey]);

  function handleChange(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: null }));
  }

  function validate() {
    const e = {};
    const c = validateClientId(form.clientId);
    const a = validateApiKey(form.apiKey);
    if (!c.valid) e.clientId = c.error;
    if (!a.valid) e.apiKey = a.error;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setClientId(form.clientId.trim());
    setApiKey(form.apiKey.trim());

    setSaving(true);
    try {
      // Sync to sheet if logged in and GAPI ready
      if (isSignedIn && window.gapi?.client?.sheets && spreadsheetId) {
        try {
          await ensureSettingsSheet(spreadsheetId);
          await saveSettingsToSheet(spreadsheetId);
          setNotification({ type: 'success', message: 'Asetukset tallennettu (paikallisesti + sheet)' });
        } catch (e) {
          console.error('[viikkoraha] Sheet sync failed:', e);
          setNotification({ type: 'success', message: 'Asetukset tallennettu (vain paikallisesti)' });
        }
      } else {
        setNotification({ type: 'success', message: 'Asetukset tallennettu (paikallisesti)' });
      }
    } finally {
      setSaving(false);
    }
  }

  function handleSpreadsheetChange(id, name) {
    setSpreadsheetId(id);
    setSpreadsheetName(name || id);
  }

  function handleResetAll() {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    clear();
    signOut();
    setForm({ clientId: '', apiKey: '' });
    setErrors({});
    setSpreadsheetName('');
    setResetConfirm(false);
    setNotification({ type: 'success', message: 'Kaikki tiedot nollattu' });
  }

  async function handleCreateNew() {
    if (!isSignedIn) {
      setNotification({ type: 'error', message: 'Kirjaudu ensin sisään' });
      return;
    }
    try {
      await initSheets();
      setNotification({ type: 'success', message: 'Taulukko alustettu' });
    } catch (err) {
      const msg = err?.message || err?.result?.error?.message || 'Alustus epäonnistui';
      setNotification({ type: 'error', message: msg });
    }
  }

  return (
    <div className="space-y-5">
      {notification && (
        <NotificationBar
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Google Client ID
        </label>
        <input
          type="text"
          value={form.clientId}
          onChange={(e) => handleChange('clientId', e.target.value)}
          placeholder="xxx.apps.googleusercontent.com"
          className={`w-full bg-gray-700 border rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.clientId ? 'border-red-500' : 'border-gray-600'
          }`}
        />
        <p className="text-xs text-gray-500 mt-1">
          Google Cloud Consolesta — OAuth 2.0 Client ID (Desktop app)
        </p>
        {errors.clientId && (
          <p className="text-xs text-red-400 mt-1">{errors.clientId}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">API-avain</label>
        <input
          type="text"
          value={form.apiKey}
          onChange={(e) => handleChange('apiKey', e.target.value)}
          placeholder="AIzaSy..."
          className={`w-full bg-gray-700 border rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.apiKey ? 'border-red-500' : 'border-gray-600'
          }`}
        />
        <p className="text-xs text-gray-500 mt-1">
          Google Cloud Consolesta — API Key (Sheets API käytössä)
        </p>
        {errors.apiKey && (
          <p className="text-xs text-red-400 mt-1">{errors.apiKey}</p>
        )}
      </div>

      {/* ── Spreadsheet picker replaces old text field ── */}
      <SpreadsheetPicker
        value={spreadsheetId}
        onChange={handleSpreadsheetChange}
        isSignedIn={isSignedIn}
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {saving ? 'Tallennetaan...' : 'Tallenna'}
      </button>

      <button
        onClick={handleResetAll}
        className={`w-full font-semibold py-3 rounded-xl transition-colors ${
          resetConfirm
            ? 'bg-red-600 hover:bg-red-500 text-white'
            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
        }`}
      >
        {resetConfirm ? 'Vahvista nollaus' : 'Nollaa kaikki tiedot'}
      </button>
    </div>
  );
}
