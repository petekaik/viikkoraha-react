import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useGoogleSheets } from '../hooks/useGoogleSheets';
import NotificationBar from '../components/NotificationBar';

const EMPTY_CHORE = { id: '', description: '', value: '', displayName: '' };

export default function ChoreManager() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.role);
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const spreadsheetId = useSettingsStore((s) => s.spreadsheetId);
  const { getChores, addChore, updateChore, deleteChore, isLoading, error, clearError } =
    useGoogleSheets();

  const [chores, setChores] = useState([]);
  const [editing, setEditing] = useState(null); // null | { ...chore, rowIndex }
  const [form, setForm] = useState(EMPTY_CHORE);
  const [notification, setNotification] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadChores = useCallback(async () => {
    if (!spreadsheetId) return;
    try {
      const data = await getChores();
      if (data) setChores(data);
    } catch { /* error handled via sheetsError */ }
  }, [getChores, spreadsheetId]);

  useEffect(() => {
    if (isSignedIn && spreadsheetId) loadChores();
  }, [isSignedIn, spreadsheetId, loadChores]);

  // Redirect non-parents
  useEffect(() => {
    if (isSignedIn && role && role !== 'parent') navigate('/', { replace: true });
  }, [role, isSignedIn, navigate]);

  function resetForm() {
    setForm(EMPTY_CHORE);
    setEditing(null);
  }

  function startEdit(chore) {
    setEditing(chore);
    setForm({ id: chore.id, description: chore.description, value: String(chore.value), displayName: chore.displayName || '' });
  }

  function handleField(field, value) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const id = form.id.trim();
    const description = form.description.trim();
    const displayName = form.displayName.trim() || description;
    const rawValue = form.value.toString().replace(',', '.');
    const valueNum = parseFloat(rawValue);

    if (!id || !description || isNaN(valueNum)) {
      setNotification({ type: 'error', message: 'Täytä ID, kuvaus ja arvo (numero).' });
      return;
    }

    try {
      if (editing) {
        await updateChore(editing.rowIndex, id, description, valueNum, displayName);
        setNotification({ type: 'success', message: 'Askare päivitetty.' });
      } else {
        await addChore(id, description, valueNum, displayName);
        setNotification({ type: 'success', message: 'Askare lisätty.' });
      }
      resetForm();
      await loadChores();
    } catch {
      setNotification({ type: 'error', message: 'Tallennus epäonnistui.' });
    }
  }

  async function handleDelete(chore) {
    setDeleteTarget(chore);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteChore(deleteTarget.rowIndex);
      setNotification({ type: 'success', message: `"${deleteTarget.displayName}" poistettu.` });
      setDeleteTarget(null);
      await loadChores();
    } catch {
      setNotification({ type: 'error', message: 'Poisto epäonnistui.' });
      setDeleteTarget(null);
    }
  }

  if (!isSignedIn) return <p className="text-gray-400 p-4">Kirjaudu sisään.</p>;
  if (!spreadsheetId) return <p className="text-gray-400 p-4">Valitse taulukko ensin.</p>;

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={() => navigate('/')}
        className="text-xs text-blue-400 hover:underline"
      >
        ← Takaisin
      </button>

      <h2 className="text-lg font-bold text-white">Askareiden hallinta</h2>

      {notification && (
        <NotificationBar
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      {error && (
        <NotificationBar
          message={error}
          type="error"
          onClose={clearError}
        />
      )}

      {/* Add / Edit form */}
      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl bg-gray-800 p-4">
        <h3 className="text-sm font-semibold text-gray-300">
          {editing ? `Muokataan: ${editing.displayName}` : 'Uusi askare'}
        </h3>
        <input
          placeholder="ID (esim. imurointi)"
          value={form.id}
          onChange={(e) => handleField('id', e.target.value)}
          className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none ring-1 ring-gray-600 focus:ring-blue-500"
        />
        <input
          placeholder="Kuvaus"
          value={form.description}
          onChange={(e) => handleField('description', e.target.value)}
          className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none ring-1 ring-gray-600 focus:ring-blue-500"
        />
        <input
          placeholder="Näyttönimi (valinnainen)"
          value={form.displayName}
          onChange={(e) => handleField('displayName', e.target.value)}
          className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none ring-1 ring-gray-600 focus:ring-blue-500"
        />
        <input
          placeholder="Arvo (€)"
          value={form.value}
          onChange={(e) => handleField('value', e.target.value)}
          type="text"
          inputMode="decimal"
          className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none ring-1 ring-gray-600 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Tallennetaan...' : editing ? 'Päivitä' : 'Lisää'}
          </button>
          {editing && (
            <button type="button" onClick={resetForm} className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">
              Peru
            </button>
          )}
        </div>
      </form>

      {/* Chore list */}
      <div className="space-y-2">
        {isLoading && chores.length === 0 ? (
          <p className="text-gray-500 text-sm">Ladataan...</p>
        ) : chores.length === 0 ? (
          <p className="text-gray-500 text-sm">Ei askareita. Lisää ensimmäinen!</p>
        ) : (
          chores.map((chore) => (
            <div
              key={chore.id}
              className="flex items-center justify-between rounded-xl bg-gray-800 p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {chore.displayName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {chore.description} · {chore.value?.toFixed(2)} €
                </p>
              </div>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => startEdit(chore)}
                  className="rounded-lg bg-gray-700 px-2 py-1 text-xs text-blue-400 hover:bg-gray-600"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(chore)}
                  className="rounded-lg bg-gray-700 px-2 py-1 text-xs text-red-400 hover:bg-gray-600"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-gray-800 p-6 shadow-xl">
            <p className="text-sm text-white mb-4">
              Poistetaanko <span className="font-semibold">"{deleteTarget.displayName}"</span>?
              Tätä ei voi perua.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
              >
                Peru
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
              >
                Poista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
