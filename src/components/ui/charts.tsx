import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatNumber } from '@/lib/format';

export interface ChartPoint {
  label: string;
  value: number;
}

/** Series colours, in the order charts hand them out. */
const chartColors = ['#0891b2', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#94a3b8'];

const tick = { fontSize: 11, fill: '#94a3b8' };

/** Axis labels: `2,500,000` → `۲٫۵م`, `12,000` → `۱۲ه`. */
function compact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${formatNumber(Math.round(value / 100_000) / 10)}م`;
  if (Math.abs(value) >= 1_000) return `${formatNumber(Math.round(value / 1_000))}ه`;
  return formatNumber(value);
}

interface TooltipBoxProps {
  active?: boolean;
  label?: string | number;
  payload?: readonly { value?: unknown; name?: unknown }[];
  format: (value: number) => string;
  /** Uses the entry's own name as the title, for charts without an axis. */
  byName?: boolean;
}

function TooltipBox({ active, label, payload, format, byName }: TooltipBoxProps) {
  const entry = payload?.[0];
  if (!active || !entry) return null;
  return (
    <div className="bg-white rounded-xl shadow-elevated px-3 py-2 text-xs">
      <p className="text-surface-400 mb-0.5">{byName ? String(entry.name ?? '') : label}</p>
      <p className="font-bold text-surface-800">{format(Number(entry.value ?? 0))}</p>
    </div>
  );
}

interface SeriesChartProps {
  data: ChartPoint[];
  height: number;
  /** Text for the tooltip value. */
  format?: (value: number) => string;
  color?: string;
}

/** A smooth line over a soft fill, for a figure over time. */
export function AreaTrend({ data, height, format = formatNumber, color = chartColors[0] }: SeriesChartProps) {
  const gradientId = `area-${color.replace('#', '')}`;
  return (
    <div dir="ltr">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 0, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.18} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="label" reversed tick={tick} axisLine={false} tickLine={false} />
          <YAxis orientation="right" width={44} tick={tick} axisLine={false} tickLine={false} tickFormatter={compact} />
          <Tooltip content={(props) => <TooltipBox {...props} format={format} />} />
          <Area isAnimationActive={false} type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} dot={{ fill: color, strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Vertical bars with rounded tops. */
export function Bars({ data, height, format = formatNumber, color = chartColors[0], barSize = 18 }: SeriesChartProps & { barSize?: number }) {
  return (
    <div dir="ltr">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} barSize={barSize} margin={{ top: 8, right: 0, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="label" reversed tick={tick} axisLine={false} tickLine={false} interval={0} />
          <YAxis orientation="right" width={36} tick={tick} axisLine={false} tickLine={false} tickFormatter={compact} allowDecimals={false} />
          <Tooltip cursor={{ fill: '#f8fafc' }} content={(props) => <TooltipBox {...props} format={format} />} />
          <Bar isAnimationActive={false} dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DonutProps {
  data: ChartPoint[];
  height: number;
  format?: (value: number) => string;
  /** How many entries the legend lists. */
  legendLimit?: number;
}

/** A ring chart with its legend underneath; the legend shows each share in percent. */
export function Donut({ data, height, format = formatNumber, legendLimit = data.length }: DonutProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div>
      <div dir="ltr">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie isAnimationActive={false} data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius="56%" outerRadius="88%" stroke="none">
              {data.map((_, i) => (
                <Cell key={i} fill={chartColors[i % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip content={(props) => <TooltipBox {...props} format={format} byName />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1.5 mt-2">
        {data.slice(0, legendLimit).map((d, i) => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
            <span className="text-surface-600 flex-1 truncate">{d.label}</span>
            <span className="font-medium text-surface-700">{formatNumber(total > 0 ? Math.round((d.value / total) * 100) : 0)}٪</span>
          </div>
        ))}
      </div>
    </div>
  );
}
