import HistoryItem from './HistoryItem';

function getWeekNumber(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const diff = (d - startOfYear) / 86400000;
  return Math.ceil((diff + startOfYear.getDay() + 1) / 7);
}

export default function HistoryList({ bookings, onApprove, userName }) {
  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <p className="text-lg mb-1">📋</p>
        <p>Ei tehtävähistoriaa</p>
      </div>
    );
  }

  const weeks = new Map();
  for (const b of bookings) {
    const wk = getWeekNumber(b.timestamp);
    if (!weeks.has(wk)) weeks.set(wk, []);
    weeks.get(wk).push(b);
  }

  return (
    <div className="mt-4">
      {[...weeks.entries()].map(([week, items]) => (
        <div key={week} className="mb-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide mt-3 mb-1 font-semibold">
            Viikko {week}
          </p>
          {items.map((b, i) => (
            <HistoryItem key={`${b.rowIndex}-${i}`} booking={b} onApprove={onApprove} />
          ))}
        </div>
      ))}
    </div>
  );
}
