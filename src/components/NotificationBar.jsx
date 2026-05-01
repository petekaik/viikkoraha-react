import { useEffect } from 'react';

const typeStyles = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-blue-600',
};

export default function NotificationBar({ message, type = 'info', onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      aria-live="polite"
      className={`fixed top-14 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-white shadow-lg
        flex items-center gap-3 max-w-sm w-[calc(100%-2rem)] ${typeStyles[type] || typeStyles.info}`}
    >
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        aria-label="Sulje"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white/50"
      >
        ✕
      </button>
    </div>
  );
}
