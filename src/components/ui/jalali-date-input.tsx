import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
  currentJalaliMonth,
  formatDateNumeric,
  formatJalaliMonth,
  jalaliDay,
  jalaliMonthGrid,
  jalaliMonthOf,
  parseJalaliDate,
  persianDays,
  shiftJalaliMonth,
  todayISO,
  type JalaliMonth,
} from '@/lib/date';
import { formatNumber } from '@/lib/format';

interface JalaliDateInputProps {
  /** The selected date as `YYYY-MM-DD`, or `''` for none. */
  value: string;
  /** Called with `YYYY-MM-DD`, or `''` when the date is cleared. */
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Offers a "clear" action. Turn off where a date is required. */
  clearable?: boolean;
  /**
   * `field` is a full form input the user can also type into.
   * `inline` is a small text button for use inside a row of text.
   */
  variant?: 'field' | 'inline';
  /** Classes for the `inline` trigger. */
  className?: string;
}

/**
 * A date input that shows and edits Jalali (Persian calendar) dates while
 * reading and writing Gregorian `YYYY-MM-DD` values.
 */
export function JalaliDateInput({ value, onChange, disabled = false, clearable = true, variant = 'field', className = '' }: JalaliDateInputProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value ? formatDateNumeric(value) : '');
  const [month, setMonth] = useState<JalaliMonth>(() => (value ? jalaliMonthOf(value) : currentJalaliMonth()));
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(value ? formatDateNumeric(value) : '');
    if (value) setMonth(jalaliMonthOf(value));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    // Inside a scrolling dialog the calendar can open below the fold.
    popoverRef.current?.scrollIntoView?.({ block: 'nearest' });
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function commitText() {
    if (!text.trim() && clearable) {
      if (value) onChange('');
      return;
    }
    const parsed = parseJalaliDate(text);
    if (parsed && parsed !== value) onChange(parsed);
    else setText(value ? formatDateNumeric(value) : '');
  }

  function pick(isoDate: string) {
    onChange(isoDate);
    setOpen(false);
  }

  const today = todayISO();

  return (
    <div ref={rootRef} className={variant === 'field' ? 'relative' : 'relative inline-block'}>
      {variant === 'field' ? (
        <>
          <input
            type="text"
            inputMode="numeric"
            className="input-field pl-10"
            value={text}
            disabled={disabled}
            placeholder="۱۴۰۵/۰۱/۰۱"
            onChange={(e) => setText(e.target.value)}
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitText();
            }}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen(!open)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-primary-600 transition-colors"
            title="انتخاب از تقویم"
          >
            <CalendarDays size={16} />
          </button>
        </>
      ) : (
        <button type="button" disabled={disabled} onClick={() => setOpen(!open)} className={className}>
          {value ? formatDateNumeric(value) : 'انتخاب تاریخ'}
        </button>
      )}

      {open && (
        <div ref={popoverRef} className="absolute right-0 top-full z-30 mt-2 mb-2 w-72 card shadow-elevated p-3 animate-scale-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <button type="button" onClick={() => setMonth(shiftJalaliMonth(month, -12))} className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors" title="سال قبل">
                <ChevronsRight size={16} className="text-surface-500" />
              </button>
              <button type="button" onClick={() => setMonth(shiftJalaliMonth(month, -1))} className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors" title="ماه قبل">
                <ChevronRight size={16} className="text-surface-500" />
              </button>
            </div>
            <p className="font-bold text-surface-800 text-sm">{formatJalaliMonth(month)}</p>
            <div className="flex items-center">
              <button type="button" onClick={() => setMonth(shiftJalaliMonth(month, 1))} className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors" title="ماه بعد">
                <ChevronLeft size={16} className="text-surface-500" />
              </button>
              <button type="button" onClick={() => setMonth(shiftJalaliMonth(month, 12))} className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors" title="سال بعد">
                <ChevronsLeft size={16} className="text-surface-500" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {persianDays.map((day) => (
              <div key={day} className="text-center text-[10px] font-medium text-surface-400 py-1" title={day}>
                {day.charAt(0)}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {jalaliMonthGrid(month).map((isoDate, i) =>
              isoDate ? (
                <button
                  key={isoDate}
                  type="button"
                  onClick={() => pick(isoDate)}
                  className={`aspect-square rounded-lg text-xs font-medium transition-all ${
                    isoDate === value
                      ? 'bg-primary-500 text-white'
                      : isoDate === today
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-surface-600 hover:bg-surface-50'
                  }`}
                >
                  {formatNumber(jalaliDay(isoDate))}
                </button>
              ) : (
                <div key={`blank-${i}`} />
              ),
            )}
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-surface-100">
            <button type="button" onClick={() => pick(today)} className="text-xs font-medium text-primary-600 hover:text-primary-700">
              امروز
            </button>
            {clearable && value && (
              <button type="button" onClick={() => pick('')} className="text-xs text-surface-400 hover:text-error-500">
                پاک کردن
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
