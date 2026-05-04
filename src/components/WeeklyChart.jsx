import { getISOWeek, formatWeekLabel } from '../utils/dateUtils';
import { useLanguageStore } from '../stores/languageStore';
import { useTranslation } from '../i18n/useTranslation';

const BAR_MAX_HEIGHT = 160;
const CHART_HEIGHT = 220;
const PADDING = { top: 10, right: 12, bottom: 30, left: 40 };
const BAR_WIDTH = Math.min(36, 48);

export default function WeeklyChart({ bookings, className = '' }) {
  const { t } = useTranslation();
  const lang = useLanguageStore((s) => s.language);

  if (!bookings || bookings.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <p className="text-gray-500 text-sm">{t('ui.chart.empty')}</p>
      </div>
    );
  }

  // IMPORTANT: Always derive week from timestamp, never from sheet's weekNumber column.
  const weekMap = {};
  const pendingMap = {};

  for (const b of bookings) {
    const wn = b.timestamp ? getISOWeek(new Date(b.timestamp)) : '?';
    if (b.status === 'paid') {
      weekMap[wn] = (weekMap[wn] || 0) + b.value;
    } else if (b.status === 'pending') {
      pendingMap[wn] = (pendingMap[wn] || 0) + b.value;
    }
    if (!weekMap[wn] && !pendingMap[wn]) {
      weekMap[wn] = weekMap[wn] || 0;
    }
  }

  // Sort weeks ascending: "2026-W18" format sorts correctly via string compare
  const weeks = Object.keys(weekMap).sort();

  const maxVal = Math.max(
    ...weeks.map((w) => (weekMap[w] || 0) + (pendingMap[w] || 0)),
    1
  );

  const barCount = weeks.length;
  const usableHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const gap = Math.min(12, barCount > 8 ? 4 : 8);
  const actualBarW = Math.min(
    BAR_WIDTH,
    Math.floor((360 - PADDING.left - PADDING.right - gap * (barCount - 1)) / barCount)
  );

  function y(val) {
    return CHART_HEIGHT - PADDING.bottom - (val / maxVal) * usableHeight;
  }

  function x(index) {
    return PADDING.left + index * (actualBarW + gap);
  }

  // Y-axis gridlines
  const gridlines = [];
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const val = Math.round((maxVal / steps) * i * 100) / 100;
    gridlines.push(val);
  }

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 380 ${CHART_HEIGHT}`}
        className="w-full h-auto"
        role="img"
        aria-label="Viikkokohtainen ansaintagraafi"
      >
        {/* Gridlines */}
        {gridlines.map((val, i) => (
          <g key={`grid-${i}`}>
            <line
              x1={PADDING.left}
              x2={370}
              y1={y(val)}
              y2={y(val)}
              stroke="#374151"
              strokeWidth="0.5"
            />
            <text
              x={PADDING.left - 4}
              y={y(val) + 4}
              textAnchor="end"
              fill="#6b7280"
              fontSize="9"
              fontFamily="system-ui, sans-serif"
            >
              {val.toFixed(val % 1 === 0 ? 0 : 1)}€
            </text>
          </g>
        ))}

        {/* Bars */}
        {weeks.map((week, i) => {
          const paidVal = weekMap[week] || 0;
          const pendingVal = pendingMap[week] || 0;
          const totalVal = paidVal + pendingVal;
          const barX = x(i);

          return (
            <g key={week}>
              {/* Pending (top, lighter) */}
              {pendingVal > 0 && (
                <rect
                  x={barX}
                  y={y(paidVal + pendingVal)}
                  width={actualBarW}
                  height={y(paidVal) - y(paidVal + pendingVal)}
                  rx="3"
                  fill="#ca8a04"
                  opacity="0.4"
                />
              )}
              {/* Paid (bottom, solid) */}
              {paidVal > 0 && (
                <rect
                  x={barX}
                  y={y(paidVal)}
                  width={actualBarW}
                  height={y(0) - y(paidVal)}
                  rx="3"
                  fill="#22c55e"
                />
              )}
              {/* Week label */}
              <text
                x={barX + actualBarW / 2}
                y={CHART_HEIGHT - 6}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize="10"
                fontFamily="system-ui, sans-serif"
              >
                {formatWeekLabel(week, lang)}
              </text>
              {/* Tooltip value */}
              {totalVal > 0 && (
                <text
                  x={barX + actualBarW / 2}
                  y={y(totalVal) - 4}
                  textAnchor="middle"
                  fill="#d1d5db"
                  fontSize="9"
                  fontFamily="system-ui, sans-serif"
                  fontWeight="600"
                >
                  {totalVal.toFixed(totalVal % 1 === 0 ? 0 : 1)}€
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span className="text-xs text-gray-400">{t('ui.statusLong.paid')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-amber-600/40" />
          <span className="text-xs text-gray-400">{t('ui.status.pending')}</span>
        </div>
      </div>
    </div>
  );
}
