import { useState, useEffect, useCallback } from 'react';
import { useGoogleSheets } from '../hooks/useGoogleSheets';
import { isGapiReady, onGapiReady } from '../hooks/useGoogleAuth';
import { useTranslation } from '../i18n/useTranslation';

/**
 * Dropdown picker for selecting a Google Sheet.
 * Lists user's spreadsheets, allows creating new ones,
 * and validates that the chosen sheet has the Viikkoraha format.
 *
 * Props:
 *   value      — current spreadsheetId (from settingsStore)
 *   onChange   — (id, name) => void  called when user selects/creates a sheet
 *   isSignedIn — boolean, whether user is authenticated
 */
export default function SpreadsheetPicker({ value, onChange, isSignedIn }) {
  const { t } = useTranslation();
  const { listSpreadsheets, createNewSpreadsheet, validateSpreadsheet, initSheets } =
    useGoogleSheets();

  const [gapiReady, setGapiReady] = useState(isGapiReady());

  const [sheets, setSheets] = useState([]);          // [{id, name, modifiedTime}]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [selected, setSelected] = useState('');       // current id selected in dropdown
  const [validation, setValidation] = useState(null);  // { valid, missing, name }
  const [loadedOnce, setLoadedOnce] = useState(false);

  // Listen for GAPI readiness globally (not via hook — avoids stale closure) 
  useEffect(() => {
    if (isGapiReady()) { setGapiReady(true); return; }
    onGapiReady(() => setGapiReady(true));
  }, []);

  // ── Load spreadsheets when signed in AND GAPI is ready ──
  const load = useCallback(async () => {
    if (!isSignedIn || !gapiReady) return;
    setLoading(true);
    setError(null);
    try {
      const files = await listSpreadsheets();
      setSheets(files);
      setLoadedOnce(true);
    } catch (e) {
      setError(e?.result?.error?.message || e.message || t('ui.spreadsheet.listFailed'));
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, gapiReady, listSpreadsheets]);

  // Refresh when auth state or GAPI readiness changes
  useEffect(() => { load(); }, [load]);

  // Sync selected from external value
  useEffect(() => {
    if (value && value !== selected) setSelected(value);
  }, [value]);

  // ── Validate selected sheet ──
  const runValidation = useCallback(async (id) => {
    if (!id) { setValidation(null); return; }
    setValidating(true);
    try {
      const v = await validateSpreadsheet(id);
      setValidation(v);
      if (v.valid) onChange(id, v.name);
    } catch (e) {
      setValidation({ valid: false, missing: [], name: '?', error: e?.result?.error?.message || e.message });
    } finally {
      setValidating(false);
    }
  }, [validateSpreadsheet, onChange]);

  // ── Handle dropdown change ──
  function handleSelect(e) {
    const id = e.target.value;
    setSelected(id);
    if (!id) return;

    const match = sheets.find(s => s.id === id);
    if (match) {
      runValidation(id);
    } else {
      setValidation({ valid: false, missing: [], name: '?', error: t('ui.spreadsheet.invalid') });
    }
  }

  // ── Create new ──
  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const result = await createNewSpreadsheet();
      if (result?.spreadsheetId) {
        setValidation({ valid: true, missing: [], name: 'Viikkoraha' });
        onChange(result.spreadsheetId, 'Viikkoraha');
        // Refresh list
        await load();
      }
    } catch (e) {
      setError(e?.result?.error?.message || e.message || t('ui.spreadsheet.createFailed'));
    } finally {
      setCreating(false);
    }
  }

  // ── Auto-fix missing tabs ──
  async function handleAutoFix() {
    setCreating(true);
    setError(null);
    try {
      await initSheets();
      await runValidation(selected);
    } catch (e) {
      setError(e?.result?.error?.message || e.message || t('ui.spreadsheet.fixFailed'));
    } finally {
      setCreating(false);
    }
  }

  // ── Render ──
  const needsFix = validation && !validation.valid && validation.missing?.length > 0;
  const noSheetsYet = loadedOnce && sheets.length === 0;
  const isBusy = !isSignedIn || !gapiReady || loading;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {t('ui.spreadsheet.label')}
      </label>

      {isBusy ? (
        <div className="flex items-center gap-3 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3">
          <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">
            {!isSignedIn ? t('ui.spreadsheet.loginPrompt') :
             !gapiReady ? t('ui.spreadsheet.connecting') :
             t('ui.spreadsheet.loadingSheets')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selected}
            onChange={handleSelect}
            className={`flex-1 bg-gray-700 border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validation?.valid ? 'border-emerald-600' :
              validation?.error ? 'border-red-500' : 'border-gray-600'
            }`}
          >
            <option value="">
              {noSheetsYet ? t('ui.spreadsheet.noSheetsPrompt') : t('ui.spreadsheet.selectPrompt')}
            </option>
            {sheets.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} {s.modifiedTime ? `(${new Date(s.modifiedTime).toLocaleDateString('fi')})` : ''}
              </option>
            ))}
          </select>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="sm:w-auto w-full px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors shrink-0"
          >
            {creating ? t('ui.spreadsheet.creating') : t('ui.spreadsheet.createNew')}
          </button>
        </div>
      )}

      {/* Validation feedback */}
      {validating && <p className="text-xs text-gray-400">{t('ui.spreadsheet.verifying')}</p>}

      {needsFix && (
        <div className="bg-amber-900/40 border border-amber-700 rounded-lg p-3 text-sm">
          <p className="text-amber-300 mb-2">{t('ui.spreadsheet.missingSheets', { sheets: validation.missing.join(', ') })}</p>
          <button
            onClick={handleAutoFix}
            disabled={creating}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 rounded-md text-white text-xs font-medium transition-colors"
          >
            {creating ? t('ui.spreadsheet.fixing') : t('ui.spreadsheet.fixSheets')}
          </button>
        </div>
      )}

      {validation?.valid && !isBusy && (
        <p className="text-xs text-emerald-400">
          {t('ui.spreadsheet.structureOk', { name: validation.name })}
        </p>
      )}

      {validation?.error && <p className="text-xs text-red-400">{validation.error}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}

      <p className="text-xs text-gray-500">
        {t('ui.spreadsheet.helpText')}
      </p>
    </div>
  );
}
