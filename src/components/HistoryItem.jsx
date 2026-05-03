export default function HistoryItem({
  booking,
  onApprove,
  onReject,
  onUnpay,
  onToggleExpand,
  isExpanded,
}) {
  const isPending = booking.status === 'pending';
  const isPaid = booking.status === 'paid';
  const isRejected = booking.status === 'rejected';

  const date = booking.timestamp
    ? new Date(booking.timestamp).toLocaleDateString('fi-FI', {
        day: 'numeric',
        month: 'numeric',
      })
    : '—';

  const statusBadge = () => {
    if (isPending)
      return (
        <span className="text-xs bg-amber-900/50 text-amber-400 px-2 py-0.5 rounded-full font-medium">
          odottaa
        </span>
      );
    if (isRejected)
      return (
        <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full font-medium">
          hylätty
        </span>
      );
    return (
      <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded-full font-medium">
        maksettu
      </span>
    );
  };

  return (
    <div>
      <div
        className={`flex items-center justify-between py-3 border-b border-gray-700/50 ${
          isPending ? 'cursor-pointer hover:bg-gray-800/50' : 'cursor-pointer hover:bg-gray-800/30'
        } px-1 rounded transition-colors`}
        onClick={() => onToggleExpand?.(booking.rowIndex)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggleExpand?.(booking.rowIndex)}
      >
        <div className="flex flex-col min-w-0">
          <span className="text-white font-medium truncate">
            {booking.description || booking.choreId}
          </span>
          <span className="text-xs text-gray-500">
            {date} — {booking.userName || 'Tuntematon'}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-2 shrink-0">
          <span className="text-white font-semibold tabular-nums">
            {Number(booking.value).toFixed(2).replace('.', ',')}€
          </span>
          {statusBadge()}
        </div>
      </div>

      {/* Expanded detail + actions */}
      {isExpanded && (
        <div className="bg-gray-800/50 rounded-lg px-4 py-3 mt-1 mb-2 text-sm space-y-2">
          {(isPaid || isRejected) && booking.approvedBy && (
            <p className="text-gray-400">
              {isPaid ? 'Maksettu' : 'Hylätty'}: {booking.approvedBy}
              {booking.approvedAt && (
                <>
                  {' '}
                  —{' '}
                  {new Date(booking.approvedAt).toLocaleString('fi-FI', {
                    day: 'numeric',
                    month: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </>
              )}
            </p>
          )}

          {isPending && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove?.(booking.rowIndex);
                }}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-md text-white text-xs font-medium transition-colors"
              >
                ✅ Hyväksy
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReject?.(booking.rowIndex);
                }}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-600 rounded-md text-white text-xs font-medium transition-colors"
              >
                ❌ Hylkää
              </button>
            </div>
          )}

          {isPaid && (
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnpay?.(booking.rowIndex);
                }}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-md text-white text-xs font-medium transition-colors"
              >
                ↩️ Palauta maksamatta-tilaan
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
