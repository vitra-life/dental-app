interface ChoiceChipsProps<T extends string | number> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Layout of the chip row. */
  className?: string;
  /** Padding and text size of each chip. */
  chipClassName?: string;
}

/** A single-choice row of pill buttons: filters above a list, or a choice in a form. */
export function ChoiceChips<T extends string | number>({
  options,
  value,
  onChange,
  className = 'flex flex-wrap items-center gap-2',
  chipClassName = 'px-3 py-1.5 text-xs',
}: ChoiceChipsProps<T>) {
  return (
    <div className={className}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`${chipClassName} rounded-xl font-medium transition-colors ${
            value === option.value ? 'bg-primary-600 text-white border border-primary-600' : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
