import { Check } from 'lucide-react';

interface CheckboxListProps<T extends string> {
  options: readonly { value: T; label: string; disabled?: boolean }[];
  value: readonly T[];
  onChange: (value: T[]) => void;
  disabled?: boolean;
}

/** A multiple-choice row of pills, each with a tick when chosen (staff types, roles). */
export function CheckboxList<T extends string>({ options, value, onChange, disabled = false }: CheckboxListProps<T>) {
  const toggle = (option: T) =>
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const checked = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            role="checkbox"
            aria-checked={checked}
            disabled={disabled || option.disabled}
            onClick={() => toggle(option.value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              checked ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-surface-200 text-surface-600 hover:bg-surface-50'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                checked ? 'bg-primary-600 border-primary-600 text-white' : 'border-surface-300'
              }`}
            >
              {checked && <Check size={10} strokeWidth={3} />}
            </span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
