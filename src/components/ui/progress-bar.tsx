interface ProgressBarProps {
  /** Fill, 0–100. */
  value: number;
  /** Colour of the fill. Ignored when `color` is set. */
  barClassName?: string;
  /** A solid CSS colour for the fill, e.g. a staff member's colour. */
  color?: string;
}

/** A thin horizontal progress bar. */
export function ProgressBar({ value, barClassName = 'bg-primary-500', color }: ProgressBarProps) {
  return (
    <div className="h-1.5 w-full bg-surface-100 rounded-full overflow-hidden">
      <div
        className={`h-full ${color ? '' : `${barClassName} `}rounded-full transition-all duration-300`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, ...(color ? { backgroundColor: color } : {}) }}
      />
    </div>
  );
}
