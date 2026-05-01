const iconMap = {
  cleaning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
      <path d="M4 21v-4l8-14 8 14v4" />
      <line x1="8" y1="21" x2="8" y2="16" />
      <line x1="16" y1="21" x2="16" y2="16" />
      <line x1="12" y1="21" x2="12" y2="10" />
    </svg>
  ),
  dishes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
      <path d="M3 12a9 9 0 1 0 18 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  ),
  cooking: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
      <path d="M4 11h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9z" />
      <line x1="8" y1="2" x2="12" y2="8" />
      <line x1="16" y1="2" x2="12" y2="8" />
    </svg>
  ),
  laundry: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
      <path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <line x1="8" y1="6" x2="8" y2="10" />
      <line x1="12" y1="6" x2="12" y2="10" />
      <line x1="16" y1="6" x2="16" y2="10" />
    </svg>
  ),
  recycle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  groceries: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="22,7 12,14 2,7" />
    </svg>
  ),
  baby: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12s0-2 4-2 4 2 4 2" />
      <line x1="9" y1="8" x2="9.01" y2="8" />
      <line x1="15" y1="8" x2="15.01" y2="8" />
    </svg>
  ),
};

const genericIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

import { CHORE_ICONS } from '../utils/sheets-schema';

export default function ChoreButton({ chore, onClick }) {
  if (!chore) return null;

  const iconKey = CHORE_ICONS[chore.id];
  const icon = iconKey ? (iconMap[iconKey] || genericIcon) : genericIcon;

  return (
    <button
      onClick={() => onClick?.(chore)}
      className="flex flex-col items-center justify-center gap-2 rounded-xl bg-gray-800 p-4 shadow transition-all
        hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.97]
        focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
        min-h-[88px]"
    >
      <span className="text-amber-400">{icon}</span>
      <span className="text-sm font-medium text-white text-center leading-tight">
        {chore.displayName || chore.description || chore.id}
      </span>
      <span className="text-xs font-semibold text-amber-400">
        {chore.value?.toFixed(2)} €
      </span>
    </button>
  );
}
