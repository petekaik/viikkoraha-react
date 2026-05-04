import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useGoogleSheets } from '../hooks/useGoogleSheets';
import { useUsers } from '../hooks/useUsers';
import { saveSettingsToSheet, ensureSettingsSheet } from '../utils/settingsSync';
import { validateClientId, validateApiKey } from '../utils/validation';
import { ROLES, USERS_RANGE } from '../utils/sheets-schema';
import { useApp } from '../utils/AppContext';
import { useTranslation } from '../i18n/useTranslation';
import NotificationBar from './NotificationBar';
import SpreadsheetPicker from './SpreadsheetPicker';
import LanguageSwitcher from './LanguageSwitcher';

export default function SettingsPanel() {
  const { t } = useTranslation();
  const { clientId, apiKey, spreadsheetId, setClientId, setApiKey, setSpreadsheetId, clear } =
    useSettingsStore();
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const setRole = useAuthStore((s) => s.setRole);
  const signOut = useAuthStore((s) => s.signOut);
  const { logout } = useGoogleAuth();
  const { initSheets } = useGoogleSheets();
  const { getUsers, saveUsers } = useUsers();
  const { closeSettings } = useApp();

  const [form, setForm] = useState({ clientId: '', apiKey: '' });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [spreadsheetName, setSpreadsheetName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const navigate = useNavigate();

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
    if (form.clientId && !c.valid) e.clientId = c.error;
    if (form.apiKey && !a.valid) e.apiKey = a.error;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setClientId(form.clientId.trim());
    setApiKey(form.apiKey.trim());

    setSaving(true);
    try {
      if (isSignedIn && window.gapi?.client?.sheets && spreadsheetId) {
        try {
          await ensureSettingsSheet(spreadsheetId);
          await saveSettingsToSheet(spreadsheetId);
          setNotification({ type: 'success', message: t('ui.savedLocallyAndSheet') });
        } catch (e) {
          console.error('[viikkoraha] Sheet sync failed:', e);
          setNotification({ type: 'success', message: t('ui.savedLocallyOnly') });
        }
      } else {
        setNotification({ type: 'success', message: t('ui.savedLocally') });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSpreadsheetChange(id, name) {
    setSpreadsheetId(id);
    setSpreadsheetName(name || id);
    // Resolve user role against the selected sheet's Users tab
    if (isSignedIn && user?.email && id) {
      try {
        const res = await window.gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: id,
          range: USERS_RANGE,
        });
        const rows = (res.result.values || []).filter(r => r[0]);
        const found = rows.find(
          r => r[0]?.trim().toLowerCase() === user.email.toLowerCase()
        );
        if (found) {
          const resolvedRole = found[2] === ROLES.PARENT ? ROLES.PARENT : ROLES.CHILD;
          setRole(resolvedRole);
        }
      } catch {
        // Users-sivu puuttuu — ok, rooli pysyy nykyisenä
      }
    }
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
    setNotification({ type: 'success', message: t('ui.allReset') });
  }

  function handleLogout() {
    logout();
    setNotification({ type: 'success', message: t('ui.loggedOut') });
  }

  async function handlePromoteToParent() {
    setPromoting(true);
    try {
      const email = user?.email;
      const name = user?.name;
      if (!email) { setNotification({ type: 'error', message: t('ui.settings.emailMissing') }); return; }
      const users = await getUsers();
      const existingIdx = users.findIndex((u) => u.email === email);
      if (existingIdx >= 0) {
        users[existingIdx].role = ROLES.PARENT;
      } else {
        users.push({ email, name: name || email, role: ROLES.PARENT });
      }
      await saveUsers(users);
      setRole(ROLES.PARENT);
      setNotification({ type: 'success', message: t('ui.promotedToParent') });
    } catch (e) {
      setNotification({ type: 'error', message: t('ui.settings.roleFailed') + ': ' + (e.message || '') });
    } finally {
      setPromoting(false);
    }
  }

  const isParent = role === ROLES.PARENT;

  return (
    <div className="space-y-5">
      {notification && (
        <NotificationBar
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Profiili */}
      {isSignedIn && user && (
        <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-4">
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.name || t('ui.unknownUser')}
              className="w-10 h-10 rounded-full border-2 border-blue-500"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-lg">
              👤
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-medium truncate">
              {user.name || t('ui.unknownUser')}
            </p>
            {user.email && (
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            )}
            <p className={`text-xs font-medium mt-0.5 ${isParent ? 'text-blue-400' : 'text-amber-400'}`}>
              {isParent ? `👑 ${t('ui.admin.users.roleParentShort')}` : `🧒 ${t('ui.admin.users.roleChildShort')}`}
            </p>
          </div>
        </div>
      )}

      {/* Admin-linkit — vain parent */}
      {isSignedIn && isParent && (
        <div className="space-y-2">
          <button
            onClick={() => { closeSettings(); navigate('/admin/chores'); }}
            className="w-full bg-gray-700 hover:bg-gray-600 text-blue-400 font-semibold py-3 rounded-xl transition-colors"
          >
            {t('ui.settings.manageChores')}
          </button>
          <button
            onClick={() => { closeSettings(); navigate('/admin/users'); }}
            className="w-full bg-gray-700 hover:bg-gray-600 text-blue-400 font-semibold py-3 rounded-xl transition-colors"
          >
            {t('ui.settings.manageUsers')}
          </button>
        </div>
      )}

      {/* Vanhemman roolin asetus — vain lapsiroolissa */}
      {isSignedIn && !isParent && (
        <button
          onClick={handlePromoteToParent}
          disabled={promoting}
          className="w-full bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {promoting ? t('ui.settings.promoting') : t('ui.settings.promoteToParent')}
        </button>
      )}

      {/* Kirjaudu ulos */}
      {isSignedIn && (
        <button
          onClick={handleLogout}
          className="w-full bg-gray-700 hover:bg-red-700 text-gray-300 hover:text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {t('ui.settings.logout')}
        </button>
      )}

      {/* Language switcher */}
      <LanguageSwitcher />

      {/* Laskentataulukko */}
      <SpreadsheetPicker
        value={spreadsheetId}
        onChange={handleSpreadsheetChange}
        isSignedIn={isSignedIn}
      />

      {/* Edistyneet asetukset */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {t('ui.settings.advancedSettings')}
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-4 pl-1">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Google Client ID
              </label>
              <input
                type="text"
                value={form.clientId}
                onChange={(e) => handleChange('clientId', e.target.value)}
                placeholder={t('ui.settings.clientIdPlaceholder')}
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.clientId ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('ui.settings.ownProjectNote')}
              </p>
              {errors.clientId && (
                <p className="text-xs text-red-400 mt-1">{errors.clientId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('ui.settings.apiKeyLabel')}</label>
              <input
                type="text"
                value={form.apiKey}
                onChange={(e) => handleChange('apiKey', e.target.value)}
                placeholder={t('ui.settings.apiKeyPlaceholder')}
                className={`w-full bg-gray-700 border rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.apiKey ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('ui.settings.ownProjectNote')}
              </p>
              {errors.apiKey && (
                <p className="text-xs text-red-400 mt-1">{errors.apiKey}</p>
              )}
            </div>

            {/* Nollaus — vain edistyneissä asetuksissa */}
            <button
              onClick={handleResetAll}
              className={`w-full font-semibold py-3 rounded-xl transition-colors ${
                resetConfirm
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {resetConfirm ? t('ui.settings.confirmReset') : t('ui.settings.resetAll')}
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {saving ? t('ui.settings.saving') : t('ui.settings.save')}
      </button>
    </div>
  );
}
