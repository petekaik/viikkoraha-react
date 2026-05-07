import { useState } from 'react';
import HistoryItem from './HistoryItem';
import { getISOWeek, formatWeekLabel } from '../utils/dateUtils';
import { useLanguageStore } from '../stores/languageStore';
import { useTranslation } from '../i18n/useTranslation';

export default function HistoryList({ bookings, onApprove, onReject, onUnpay, onDelete, isParent, userName }) {
  const [expandedItem, setExpandedItem] = useState(null);
  const { t } = useTranslation();
  const lang = useLanguageStore((s) => s.language);

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <p className="text-lg mb-1">📋</p>
        <p>{t('ui.history.empty')}</p>
      </div>
    );
  }

  // IMPORTANT: Always derive week from timestamp, never from sheet's weekNumber column.
  // The sheet column may be stale or manually edited — timestamp is the source of truth.
  const weeks = new Map();
  for (const b of bookings) {
    const wk = b.timestamp ? getISOWeek(new Date(b.timestamp)) : '?';
    if (!weeks.has(wk)) weeks.set(wk, []);
    weeks.get(wk).push(b);
  }

  // Sort items within each week by timestamp descending (newest first)
  for (const items of weeks.values()) {
    items.sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    });
  }

  // Sort weeks descending: "2026-W18" format sorts correctly via string compare
  const sortedWeeks = [...weeks.entries()].sort(([a], [b]) => b.localeCompare(a));

  return (
    <div className="mt-4">
      {sortedWeeks.map(([week, items]) => (
        <div key={week} className="mb-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide mt-3 mb-1 font-semibold">
            {formatWeekLabel(week, lang)}
          </p>
          {items.map((b, i) => (
            <HistoryItem
              key={`${b.rowIndex}-${i}`}
              booking={b}
              onApprove={onApprove}
              onReject={onReject}
              onUnpay={onUnpay}
              onDelete={onDelete}
              isParent={isParent}
              onToggleExpand={(rowIndex) =>
                setExpandedItem(expandedItem === rowIndex ? null : rowIndex)
              }
              isExpanded={expandedItem === b.rowIndex}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
