interface ProgressBarProps {
  /** Fill, 0–100. */
  value: number;
  /** Gradient of the fill. Ignored when `color` is set. */
  barClassName?: string;
  /** A solid CSS colour for the fill, e.g. a staff member's colour. */
  color?: string;
  /** Animates changes over 500ms. */
  slow?: boolean;
}

/** A thin horizontal progress bar. */
export function ProgressBar({ value, barClassName = 'bg-linear-to-l/srgb from-primary-500 to-primary-300', color, slow = false }: ProgressBarProps) {
  return (
    <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
      <div
        className={`h-full ${color ? '' : `${barClassName} `}rounded-full transition-all${slow ? ' duration-500' : ''}`}
        style={{ width: `${value}%`, ...(color ? { backgroundColor: color } : {}) }}
      />
    </div>
  );
}
