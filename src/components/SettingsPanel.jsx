import { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import { useGoogleSheets } from '../hooks/useGoogleSheets';
import { validateSpreadsheetId, validateClientId, validateApiKey } from '../utils/validation';
import NotificationBar from './NotificationBar';

export default function SettingsPanel() {
  const { clientId, apiKey, spreadsheetId, setClientId, setApiKey, setSpreadsheetId, clear } =
    useSettingsStore();
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const signOut = useAuthStore((s) => s.signOut);
  const { initSheets, createNewSpreadsheet, isLoading: sheetsLoading } = useGoogleSheets();

  const [form, setForm] = useState({ clientId: '', apiKey: '', spreadsheetId: '' });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    setForm({ clientId, apiKey, spreadsheetId });
  }, [clientId, apiKey, spreadsheetId]);

  function handleChange(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: null }));
  }

  function validate() {
    const e = {};
    const c = validateClientId(form.clientId);
    const a = validateApiKey(form.apiKey);
    const s = validateSpreadsheetId(form.spreadsheetId);
    if (!c.valid) e.clientId = c.error;
    if (!a.valid) e.apiKey = a.error;
    if (!s.valid) e.spreadsheetId = s.error;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    setClientId(form.clientId.trim());
    setApiKey(form.apiKey.trim());
    const idMatch = form.spreadsheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const id = idMatch ? idMatch[1] : form.spreadsheetId.trim();
    setSpreadsheetId(id);
    setNotification({ type: 'success', message: 'Asetukset tallennettu' });
  }

  function handleResetAll() {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    // Clear all settings, sign out, and reset form
    clear();
    signOut();
    setForm({ clientId: '', apiKey: '', spreadsheetId: '' });
    setErrors({});
    setResetConfirm(false);
    setNotification({ type: 'success', message: 'Kaikki tiedot nollattu' });
  }

  async function handleCreateNew() {
    if (!isSignedIn) {
      setNotification({ type: 'error', message: 'Kirjaudu ensin sisään' });
      return;
    }
    try {
      const result = await createNewSpreadsheet();
      if (result?.spreadsheetId) {
        // Auto-fill the form and store with the new ID
        setSpreadsheetId(result.spreadsheetId);
        setForm((p) => ({ ...p, spreadsheetId: result.spreadsheetId }));
        setNotification({
          type: 'success',
          message: `Uusi Viikkoraha luotu! ID täytetty.`,
        });
      } else {
        setNotification({ type: 'error', message: 'Luonti epäonnistui: ei saatu ID:tä' });
      }
    } catch (err) {
      const msg = err?.message || err?.result?.error?.message || 'Luonti epäonnistui';
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

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Spreadsheet ID tai URL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.spreadsheetId}
            onChange={(e) => handleChange('spreadsheetId', e.target.value)}
            placeholder="docs.google.com/spreadsheets/d/..."
            className={`flex-1 bg-gray-700 border rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.spreadsheetId ? 'border-red-500' : 'border-gray-600'
            }`}
          />
          <button
            onClick={handleCreateNew}
            disabled={sheetsLoading || !isSignedIn}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors shrink-0"
          >
            {sheetsLoading ? 'Luodaan...' : 'Luo uusi'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Olemassa olevan spreadsheetin URL, tai luo uusi tästä
        </p>
        {errors.spreadsheetId && (
          <p className="text-xs text-red-400 mt-1">{errors.spreadsheetId}</p>
        )}
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Tallenna
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
