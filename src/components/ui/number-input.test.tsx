import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { cleanNumberText, parseNumberText } from '@/lib/format';
import { NumberInput } from './number-input';

afterEach(cleanup);

describe('cleanNumberText', () => {
  it('keeps digits only, converting Persian ones', () => {
    expect(cleanNumberText('۱۲a3-', false)).toBe('123');
    expect(cleanNumberText('1.5', false)).toBe('15');
  });

  it('keeps one decimal point when allowed', () => {
    expect(cleanNumberText('9.5.1', true)).toBe('9.51');
    expect(cleanNumberText('۹٫۵', true)).toBe('9.5');
  });
});

describe('parseNumberText', () => {
  it('gives null for an empty field', () => {
    expect(parseNumberText('')).toBeNull();
    expect(parseNumberText('.')).toBeNull();
    expect(parseNumberText('0')).toBe(0);
    expect(parseNumberText('9.')).toBe(9);
  });
});

/** A parent that stores what the field reports, like the forms do. */
function Harness({ initial, onValue }: { initial: number | null; onValue: (v: number | null) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <NumberInput aria-label="n" value={value} onChange={(v) => { setValue(v); onValue(v); }} />
      <button onClick={() => setValue(45)}>set</button>
    </>
  );
}

describe('NumberInput', () => {
  it('can be emptied and stays empty', () => {
    const onValue = vi.fn();
    render(<Harness initial={30} onValue={onValue} />);
    const input = screen.getByLabelText('n') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');
    expect(onValue).toHaveBeenLastCalledWith(null);
    fireEvent.change(input, { target: { value: '۶۰' } });
    expect(input.value).toBe('60');
    expect(onValue).toHaveBeenLastCalledWith(60);
  });

  it('shows a value set from outside', () => {
    render(<Harness initial={null} onValue={() => {}} />);
    fireEvent.click(screen.getByText('set'));
    expect((screen.getByLabelText('n') as HTMLInputElement).value).toBe('45');
  });

  it('is a text field, so it has no arrows and ignores the scroll wheel', () => {
    render(<Harness initial={5} onValue={() => {}} />);
    const input = screen.getByLabelText('n') as HTMLInputElement;
    expect(input.type).toBe('text');
    expect(input.inputMode).toBe('numeric');
  });
});
