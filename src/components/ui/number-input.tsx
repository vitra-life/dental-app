import { useState, type InputHTMLAttributes } from 'react';
import { cleanNumberText, parseNumberText } from '@/lib/format';

type NativeProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'inputMode'>;

interface NumberInputProps extends NativeProps {
  /** `null` while the field is empty. */
  value: number | null;
  onChange: (value: number | null) => void;
  /** Allow a decimal point (e.g. a tax rate). Whole numbers only otherwise. */
  decimal?: boolean;
}

/**
 * A number field that can be emptied while typing and has none of the browser's
 * number-input behaviour: no up/down arrows, and scrolling over it does not
 * change the value. Persian digits are accepted; a numeric keyboard opens on phones.
 */
export function NumberInput({ value, onChange, decimal = false, className = 'input-field', ...rest }: NumberInputProps) {
  const [text, setText] = useState(() => (value === null ? '' : String(value)));

  // A new value from outside (e.g. a price filled in from a service) replaces the text.
  if (parseNumberText(text) !== value) setText(value === null ? '' : String(value));

  return (
    <input
      {...rest}
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      className={className}
      value={text}
      onChange={(e) => {
        const next = cleanNumberText(e.target.value, decimal);
        setText(next);
        onChange(parseNumberText(next));
      }}
    />
  );
}
