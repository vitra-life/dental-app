export interface Bar {
  label: string;
  value: number;
  /** Text shown above the bar on hover. */
  tooltip: string;
}

const barTones = {
  primary: { bar: 'from-primary-500 to-primary-300', hover: 'hover:from-primary-600 hover:to-primary-400' },
  accent: { bar: 'from-accent-500 to-accent-300', hover: 'hover:from-accent-600 hover:to-accent-400' },
} as const;

interface BarChartProps {
  bars: Bar[];
  tone: keyof typeof barTones;
  /** Gap and height of the chart, e.g. `gap-2 h-48`. */
  className: string;
  /** Smallest bar height in px, so empty days still show. */
  minHeight?: number;
  /** Darkens a bar on hover. */
  hover?: boolean;
  /** Smaller tooltip text that never wraps, for long values such as money. */
  compactTooltip?: boolean;
}

/** A row of vertical bars scaled to the largest value. */
export function BarChart({ bars, tone, className, minHeight = 8, hover = true, compactTooltip = false }: BarChartProps) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  const t = barTones[tone];
  return (
    <div className={`flex items-end justify-between ${className}`}>
      {bars.map((bar, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full flex-1 flex items-end">
            <div
              className={`w-full bg-gradient-to-t ${t.bar} rounded-t-lg transition-all duration-500${hover ? ` ${t.hover}` : ''} group relative`}
              style={{ height: `${(bar.value / max) * 100}%`, minHeight: `${minHeight}px` }}
            >
              <span
                className={
                  compactTooltip
                    ? 'absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-surface-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'
                    : 'absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-surface-700 opacity-0 group-hover:opacity-100 transition-opacity'
                }
              >
                {bar.tooltip}
              </span>
            </div>
          </div>
          <span className="text-[11px] text-surface-500 font-medium">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}
