import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { IconBox } from './icon-box';
import type { Tone } from './tones';

interface StatTileProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: Tone;
  /** `2xl` for counts, `lg` for long values such as money. */
  size?: 'lg' | '2xl';
  /** Text colour of the value. */
  valueClassName?: string;
  /** Entrance animation delay in ms. */
  delay?: number;
}

const delayStyle = (delay?: number) => (delay ? { animationDelay: `${delay}ms` } : undefined);

/** A summary figure with its icon on the opposite side. */
export function StatTile({ label, value, icon, tone, size = '2xl', valueClassName = 'text-surface-800', delay }: StatTileProps) {
  return (
    <div className="stat-card animate-slide-up" style={delayStyle(delay)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-surface-500 mb-2">{label}</p>
          <p className={`${size === '2xl' ? 'text-2xl' : 'text-lg'} font-bold ${valueClassName}`}>{value}</p>
        </div>
        <IconBox icon={icon} tone={tone} size={18} />
      </div>
    </div>
  );
}

interface MiniStatProps {
  label: string;
  icon: LucideIcon;
  tone: Tone;
  delay?: number;
  /** The value; may include a trailing note. */
  children: ReactNode;
}

/** A compact figure with its icon beside it. */
export function MiniStat({ label, icon, tone, delay, children }: MiniStatProps) {
  return (
    <div className="card p-4 animate-slide-up" style={delayStyle(delay)}>
      <div className="flex items-center gap-3">
        <IconBox icon={icon} tone={tone} size={18} />
        <div>
          <p className="text-xs text-surface-500">{label}</p>
          <p className="text-lg font-bold text-surface-800">{children}</p>
        </div>
      </div>
    </div>
  );
}
