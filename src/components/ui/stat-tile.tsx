import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { IconBox } from './icon-box';
import type { Tone } from './tones';

interface StatTileProps {
  label: string;
  value: ReactNode;
  /** A small note under the value. */
  sub?: ReactNode;
  /** Shown with `tone` opposite the figure. */
  icon?: LucideIcon;
  tone?: Tone;
  /** Text colour of the value. */
  valueClassName?: string;
}

/** A summary figure in a card: label, value and an optional note and icon. */
export function StatTile({ label, value, sub, icon, tone = 'primary', valueClassName = 'text-surface-900' }: StatTileProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-surface-500 font-medium">{label}</p>
          <p className={`text-lg md:text-xl font-bold mt-1 ${valueClassName}`}>{value}</p>
          {sub && <p className="text-xs text-surface-400 mt-0.5">{sub}</p>}
        </div>
        {icon && <IconBox icon={icon} tone={tone} />}
      </div>
    </div>
  );
}
