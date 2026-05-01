export default function HistoryItem({ booking, onApprove }) {
  const isPending = booking.status === 'pending';
  const date = booking.timestamp
    ? new Date(booking.timestamp).toLocaleDateString('fi-FI', {
        day: 'numeric', month: 'numeric',
      })
    : '—';

  return (
    <div
      className={`flex items-center justify-between py-3 border-b border-gray-700/50 ${
        isPending ? 'cursor-pointer hover:bg-gray-800/50' : 'cursor-default'
      } px-1 rounded transition-colors`}
      onClick={() => isPending && onApprove?.(booking.rowIndex)}
      role={isPending ? 'button' : undefined}
      tabIndex={isPending ? 0 : undefined}
      onKeyDown={(e) => isPending && e.key === 'Enter' && onApprove?.(booking.rowIndex)}
    >
      <div className="flex flex-col min-w-0">
        <span className="text-white font-medium truncate">
          {booking.description || booking.choreId}
        </span>
        <span className="text-xs text-gray-500">{date}</span>
      </div>
      <div className="flex items-center gap-2 ml-2 shrink-0">
        <span className="text-white font-semibold tabular-nums">
          {Number(booking.value).toFixed(2)}€
        </span>
        {isPending ? (
          <span className="text-xs bg-amber-900/50 text-amber-400 px-2 py-0.5 rounded-full font-medium">
            odottaa
          </span>
        ) : (
          <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded-full font-medium">
            maksettu
          </span>
        )}
      </div>
    </div>
  );
}
