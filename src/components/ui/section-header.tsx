import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  /** A short note shown opposite the title, e.g. the period a chart covers. */
  note?: string;
  /** Replaces the note, for headers that need a button or a badge. */
  aside?: ReactNode;
  /** Bottom margin. */
  className?: string;
}

/** The title row of a card. */
export function SectionHeader({ title, note, aside, className = 'mb-4' }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <h2 className="text-sm font-semibold text-surface-700">{title}</h2>
      {aside ?? (note && <span className="text-xs text-surface-400 bg-surface-50 px-2 py-1 rounded-lg">{note}</span>)}
    </div>
  );
}
