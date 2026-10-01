import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { IconBox } from './icon-box';
import type { Tone } from './tones';

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: Tone;
  /** Replaces the icon box, for headers that show more than an icon. */
  aside?: ReactNode;
  /** Bottom margin. */
  className?: string;
}

/** The title row of a card: heading and subtitle, with an icon box opposite. */
export function SectionHeader({ title, subtitle, icon, tone, aside, className = 'mb-6' }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div>
        <h3 className="font-bold text-surface-800">{title}</h3>
        <p className="text-xs text-surface-400 mt-0.5">{subtitle}</p>
      </div>
      {aside ?? <IconBox icon={icon} tone={tone} />}
    </div>
  );
}
