import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUsers } from '../hooks/useUsers';
import { useTranslation } from '../i18n/useTranslation';
import NotificationBar from '../components/NotificationBar';

const EMPTY_USER = { email: '', name: '', role: 'child' };

export default function UsersManager() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.role);
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const spreadsheetId = useSettingsStore((s) => s.spreadsheetId);
  const { getUsers, saveUsers } = useUsers();

  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null); // { email, name, role } | null
  const [form, setForm] = useState(EMPTY_USER);
  const [notification, setNotification] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!spreadsheetId) return;
    try {
      const data = await getUsers();
      if (data) setUsers(data);
    } catch {
      /* error handled via notification */
    }
  }, [getUsers, spreadsheetId]);

  useEffect(() => {
    if (isSignedIn && spreadsheetId) loadUsers();
  }, [isSignedIn, spreadsheetId, loadUsers]);

  // Redirect non-parents
  useEffect(() => {
    if (isSignedIn && role && role !== 'parent') navigate('/', { replace: true });
  }, [role, isSignedIn, navigate]);

  function resetForm() {
    setForm(EMPTY_USER);
    setEditing(null);
  }

  function startEdit(user) {
    setEditing(user);
    setForm({ email: user.email, name: user.name, role: user.role });
  }

  function handleField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    const name = form.name.trim();
    const userRole = form.role;

    if (!email || !name) {
      setNotification({ type: 'error', message: t('ui.admin.users.formValidation') });
      return;
    }
    if (!email.includes('@')) {
      setNotification({ type: 'error', message: t('ui.admin.users.invalidEmail') });
      return;
    }

    setIsSaving(true);
    try {
      let updated;
      if (editing) {
        // Replace existing user
        updated = users.map((u) =>
          u.email.toLowerCase() === editing.email.toLowerCase()
            ? { email, name, role: userRole }
            : u
        );
      } else {
        // Check for duplicate
        if (users.some((u) => u.email.toLowerCase() === email)) {
          setNotification({ type: 'error', message: t('ui.admin.users.duplicate') });
          setIsSaving(false);
          return;
        }
        updated = [...users, { email, name, role: userRole }];
      }

      await saveUsers(updated);
      setNotification({
        type: 'success',
        message: editing ? t('ui.admin.users.updated') : t('ui.admin.users.added'),
      });
      resetForm();
      setUsers(updated); // optimistic update — saveUsers just wrote to sheet
    } catch {
      setNotification({ type: 'error', message: t('ui.admin.saveFailed') });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(target) {
    setDeleteTarget(target);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      const updated = users.filter(
        (u) => u.email.toLowerCase() !== deleteTarget.email.toLowerCase()
      );
      await saveUsers(updated);
      setNotification({
        type: 'success',
        message: t('ui.admin.users.deleted', { name: deleteTarget.name }),
      });
      setDeleteTarget(null);
      setUsers(updated);
    } catch {
      setNotification({ type: 'error', message: t('ui.admin.deleteFailed') });
      setDeleteTarget(null);
    } finally {
      setIsSaving(false);
    }
  }

  if (!isSignedIn) return <p className="text-gray-400 p-4">{t('ui.admin.loginRequired')}</p>;
  if (!spreadsheetId) return <p className="text-gray-400 p-4">{t('ui.admin.selectSpreadsheetFirst')}</p>;

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={() => navigate('/')}
        className="text-xs text-blue-400 hover:underline"
      >
        ← {t('ui.admin.back')}
      </button>

      <h2 className="text-lg font-bold text-white">{t('ui.admin.users.management')}</h2>

      {notification && (
        <NotificationBar
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Add / Edit form */}
      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl bg-gray-800 p-4">
        <h3 className="text-sm font-semibold text-gray-300">
          {editing ? t('ui.admin.users.editing', { name: editing.name }) : t('ui.admin.users.addMember')}
        </h3>

        <input
          placeholder={t('ui.admin.users.emailPlaceholder')}
          value={form.email}
          onChange={(e) => handleField('email', e.target.value)}
          type="email"
          autoComplete="email"
          disabled={!!editing}
          className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none ring-1 ring-gray-600 focus:ring-blue-500 disabled:opacity-50"
        />

        <input
          placeholder={t('ui.admin.users.namePlaceholder')}
          value={form.name}
          onChange={(e) => handleField('name', e.target.value)}
          className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none ring-1 ring-gray-600 focus:ring-blue-500"
        />

        <select
          value={form.role}
          onChange={(e) => handleField('role', e.target.value)}
          className="w-full rounded-lg bg-gray-700 px-3 py-2 text-sm text-white outline-none ring-1 ring-gray-600 focus:ring-blue-500"
        >
          <option value="child">{t('ui.admin.users.roleChild')}</option>
          <option value="parent">{t('ui.admin.users.roleParent')}</option>
        </select>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {isSaving ? t('ui.admin.saving') : editing ? t('ui.admin.update') : t('ui.admin.add')}
          </button>
          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
            >
              {t('ui.admin.cancel')}
            </button>
          )}
        </div>
      </form>

      {/* User list */}
      <div className="space-y-2">
        {users.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('ui.admin.users.noMembers')}</p>
        ) : (
          users.map((user) => (
            <div
              key={user.email}
              className="flex items-center justify-between rounded-xl bg-gray-800 p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name}
                  {user.role === 'parent' && (
                    <span className="ml-1 text-xs text-yellow-500 font-normal">
                      ({t('ui.admin.users.roleParentShort')})
                    </span>
                  )}
                  {user.role === 'child' && (
                    <span className="ml-1 text-xs text-blue-400 font-normal">
                      ({t('ui.admin.users.roleChildShort')})
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => startEdit(user)}
                  className="rounded-lg bg-gray-700 px-2 py-1 text-xs text-blue-400 hover:bg-gray-600"
                  aria-label={t('ui.admin.users.editLabel', { name: user.name })}
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(user)}
                  className="rounded-lg bg-gray-700 px-2 py-1 text-xs text-red-400 hover:bg-gray-600"
                  aria-label={t('ui.admin.users.deleteLabel', { name: user.name })}
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
              {t('ui.admin.users.confirmDelete', { name: deleteTarget.name })}
              {' '}{t('ui.admin.irreversible')}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
              >
                {t('ui.admin.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                disabled={isSaving}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {t('ui.admin.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
