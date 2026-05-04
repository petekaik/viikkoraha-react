import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../i18n/useTranslation';

export default function ConfirmDialog({ chore, user, onConfirm, onCancel }) {
  const { t } = useTranslation();
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!chore) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };

    document.addEventListener('keydown', handleKey);
    cancelRef.current?.focus();

    return () => document.removeEventListener('keydown', handleKey);
  }, [chore, onCancel]);

  if (!chore) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-gray-800 p-6 shadow-2xl
          animate-scaleIn"
      >
        <h2 className="text-lg font-semibold text-white mb-2">
          {chore.description || chore.displayName || chore.id}
        </h2>
        <p className="text-amber-400 text-xl font-bold mb-1">
          {chore.value?.toFixed(2)} €
        </p>
        {user && (
          <p className="text-gray-400 text-xs mb-4 truncate">
            {user.name || t('ui.unknownUser')}
            {user.email && <span className="text-gray-500"> · {user.email}</span>}
          </p>
        )}
        {!user && <div className="mb-4" />}

        <div className="flex gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white
              hover:bg-red-700 active:scale-[0.97] transition-all
              focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800
              min-h-[44px]"
          >
            Peruuta ✗
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white
              hover:bg-green-700 active:scale-[0.97] transition-all
              focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800
              min-h-[44px]"
          >
            OK ✓
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
