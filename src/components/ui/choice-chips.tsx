interface ChoiceChipsProps<T extends string | number> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Layout of the chip row. */
  className?: string;
  /** Padding of each chip. */
  chipClassName?: string;
}

/** A single-choice row of pill buttons. */
export function ChoiceChips<T extends string | number>({
  options,
  value,
  onChange,
  className = 'flex items-center gap-2',
  chipClassName = 'px-4 py-2',
}: ChoiceChipsProps<T>) {
  return (
    <div className={className}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`${chipClassName} rounded-xl text-sm font-medium transition-all ${
            value === option.value ? 'bg-primary-50 text-primary-600 border border-primary-200' : 'bg-surface-50 text-surface-400 border border-surface-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
