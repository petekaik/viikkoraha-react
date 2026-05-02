import { useState, useEffect, useCallback } from 'react';
import { useGoogleSheets } from '../hooks/useGoogleSheets';
import { validateSpreadsheetId } from '../utils/validation';

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
  const { listSpreadsheets, createNewSpreadsheet, validateSpreadsheet, initSheets } =
    useGoogleSheets();

  const [sheets, setSheets] = useState([]);          // [{id, name, modifiedTime}]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [selected, setSelected] = useState('');       // current id selected in dropdown
  const [validation, setValidation] = useState(null);  // { valid, missing, name }

  // ── Load spreadsheets when signed in ──
  const load = useCallback(async () => {
    if (!isSignedIn || !window.gapi?.client?.drive) return;
    setLoading(true);
    setError(null);
    try {
      const files = await listSpreadsheets();
      setSheets(files);
    } catch (e) {
      setError(e?.result?.error?.message || e.message || 'Spreadsheet-listaus epäonnistui');
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, listSpreadsheets]);

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

    // Check if already in list
    const match = sheets.find(s => s.id === id);
    if (match) {
      runValidation(id);
    } else {
      // User typed/pasted an ID manually — validate too
      const parsed = validateSpreadsheetId(id);
      if (parsed.valid) runValidation(id);
      else setValidation({ valid: false, missing: [], name: '?', error: parsed.error });
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
      setError(e?.result?.error?.message || e.message || 'Luonti epäonnistui');
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
      setError(e?.result?.error?.message || e.message || 'Korjaus epäonnistui');
    } finally {
      setCreating(false);
    }
  }

  // ── Render ──
  const needsFix = validation && !validation.valid && validation.missing?.length > 0;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Laskentataulukko
      </label>

      <div className="flex gap-2">
        <select
          value={selected}
          onChange={handleSelect}
          disabled={!isSignedIn || loading}
          className={`flex-1 bg-gray-700 border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
            validation?.valid ? 'border-emerald-600' :
            validation?.error || error ? 'border-red-500' : 'border-gray-600'
          }`}
        >
          <option value="">
            {loading ? 'Ladataan...' : isSignedIn ? '-- Valitse laskentataulukko --' : 'Kirjaudu ensin sisään'}
          </option>
          {sheets.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} {s.modifiedTime ? `(${new Date(s.modifiedTime).toLocaleDateString('fi')})` : ''}
            </option>
          ))}
        </select>

        <button
          onClick={handleCreate}
          disabled={creating || !isSignedIn}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors shrink-0"
        >
          {creating ? 'Luodaan...' : 'Luo uusi'}
        </button>
      </div>

      {/* Validation feedback */}
      {validating && !validation && (
        <p className="text-xs text-gray-400">Tarkistetaan laskentataulukon rakennetta...</p>
      )}

      {needsFix && (
        <div className="bg-amber-900/40 border border-amber-700 rounded-lg p-3 text-sm">
          <p className="text-amber-300 mb-2">
            ⚠️ Laskentataulukosta puuttuu: {validation.missing.join(', ')}
          </p>
          <button
            onClick={handleAutoFix}
            disabled={creating}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 rounded-md text-white text-xs font-medium transition-colors"
          >
            {creating ? 'Korjataan...' : 'Lisää puuttuvat välilehdet'}
          </button>
        </div>
      )}

      {validation?.valid && (
        <p className="text-xs text-emerald-400">
          ✅ "{validation.name}" — laskentataulukon rakenne kunnossa
        </p>
      )}

      {validation?.error && (
        <p className="text-xs text-red-400">{validation.error}</p>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <p className="text-xs text-gray-500">
        Valitse olemassa oleva taulukko tai luo uusi. Sovellus tarkistaa ja tarvittaessa lisää puuttuvat välilehdet.
      </p>
    </div>
  );
}
