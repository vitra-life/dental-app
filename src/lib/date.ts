import { addDays, differenceInCalendarDays, differenceInYears, format, parseISO, subMonths } from 'date-fns';
import moment from 'moment-jalaali';

/**
 * All date handling goes through this file.
 *
 * Storage is Gregorian: `YYYY-MM-DD` for calendar dates and ISO timestamps for
 * `created_at`. date-fns does the Gregorian maths in the user's local time zone.
 * Everything the user sees is Jalali (Persian calendar), produced by moment-jalaali.
 */

moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: true });

export type DateInput = string | Date;

/** A Jalali month: `jy` is the year, `jm` the month index (0 = فروردین). */
export interface JalaliMonth {
  jy: number;
  jm: number;
}

function toDate(value: DateInput): Date {
  return typeof value === 'string' ? parseISO(value) : value;
}

// ── Gregorian storage values ────────────────────────────────────────────

/** `YYYY-MM-DD` in local time. */
export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** `YYYY-MM-DD` for today plus `days` (negative for the past). */
export function daysFromToday(days: number): string {
  return toISODate(addDays(new Date(), days));
}

/** `YYYY-MM-DD` for the day `months` calendar months before today. */
export function monthsBeforeToday(months: number): string {
  return toISODate(subMonths(new Date(), months));
}

/** ISO timestamp for now plus `days`. */
export function timestampFromNow(days: number): string {
  return addDays(new Date(), days).toISOString();
}

/** `YYYY-MM-DD` for the same Jalali day `months` Jalali months from today. */
export function jalaliMonthsFromToday(months: number): string {
  return toISODate(moment().add(months, 'jMonth').toDate());
}

export function addDaysISO(isoDate: string, days: number): string {
  return toISODate(addDays(parseISO(isoDate), days));
}

/** Whole calendar days from today until `value`; negative once it has passed. */
export function daysUntil(value: DateInput): number {
  return differenceInCalendarDays(toDate(value), new Date());
}

export function isPast(value: DateInput): boolean {
  return daysUntil(value) < 0;
}

export function getAge(birthDate: string): number {
  return differenceInYears(new Date(), parseISO(birthDate));
}

/** The local calendar date (`YYYY-MM-DD`) of an ISO timestamp. */
export function dateOfTimestamp(timestamp: string): string {
  return toISODate(parseISO(timestamp));
}

// ── Jalali display ──────────────────────────────────────────────────────

/** e.g. `۹ مهر ۱۴۰۵` */
export function formatDate(value: DateInput): string {
  return moment(toDate(value)).format('jD jMMMM jYYYY');
}

/** e.g. `۹ مهر` */
export function formatDateShort(value: DateInput): string {
  return moment(toDate(value)).format('jD jMMMM');
}

/** e.g. `۱۴۰۵/۰۷/۰۹`, the form used in date inputs. */
export function formatDateNumeric(value: DateInput): string {
  return moment(toDate(value)).format('jYYYY/jMM/jDD');
}

export const persianDays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

/** Column of a date in a week that starts on Saturday (0 = شنبه). */
export function weekdayIndex(value: DateInput): number {
  return (toDate(value).getDay() + 1) % 7;
}

export function getPersianDayName(value: DateInput): string {
  return persianDays[weekdayIndex(value)];
}

/** Day of the Jalali month, 1–31. */
export function jalaliDay(value: DateInput): number {
  return moment(toDate(value)).jDate();
}

// ── Jalali months ───────────────────────────────────────────────────────

export function jalaliMonthOf(value: DateInput): JalaliMonth {
  const m = moment(toDate(value));
  return { jy: m.jYear(), jm: m.jMonth() };
}

export function currentJalaliMonth(): JalaliMonth {
  return jalaliMonthOf(new Date());
}

export function shiftJalaliMonth({ jy, jm }: JalaliMonth, delta: number): JalaliMonth {
  const index = jy * 12 + jm + delta;
  return { jy: Math.floor(index / 12), jm: ((index % 12) + 12) % 12 };
}

export function isInJalaliMonth(value: DateInput, month: JalaliMonth): boolean {
  const own = jalaliMonthOf(value);
  return own.jy === month.jy && own.jm === month.jm;
}

function jalaliToDate(jy: number, jm: number, jd: number): Date {
  return moment(`${jy}/${jm + 1}/${jd}`, 'jYYYY/jM/jD').toDate();
}

/** Month name alone, e.g. `مهر`. */
export function jalaliMonthName(month: JalaliMonth): string {
  return moment(jalaliToDate(month.jy, month.jm, 1)).format('jMMMM');
}

/** Month and year, e.g. `مهر ۱۴۰۵`. */
export function formatJalaliMonth(month: JalaliMonth): string {
  return moment(jalaliToDate(month.jy, month.jm, 1)).format('jMMMM jYYYY');
}

/** Every day of a Jalali month as `YYYY-MM-DD`, in order. */
export function jalaliMonthDays({ jy, jm }: JalaliMonth): string[] {
  const count = moment.jDaysInMonth(jy, jm);
  return Array.from({ length: count }, (_, i) => toISODate(jalaliToDate(jy, jm, i + 1)));
}

/**
 * The cells of a month calendar whose weeks start on Saturday: `null` for the
 * blanks before the 1st, then one `YYYY-MM-DD` per day.
 */
export function jalaliMonthGrid(month: JalaliMonth): (string | null)[] {
  const days = jalaliMonthDays(month);
  return [...Array<null>(weekdayIndex(days[0])).fill(null), ...days];
}

/**
 * Reads a typed Jalali date such as `1405/7/9` or `۱۴۰۵/۰۷/۰۹` and returns it as
 * `YYYY-MM-DD`, or `null` when it is not a real date.
 */
export function parseJalaliDate(text: string): string | null {
  const latin = text
    .trim()
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const match = /^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/.exec(latin);
  if (!match) return null;
  const [jy, month, jd] = match.slice(1).map(Number);
  if (month < 1 || month > 12 || jd < 1 || jd > moment.jDaysInMonth(jy, month - 1)) return null;
  return toISODate(jalaliToDate(jy, month - 1, jd));
}

// ── Ranges ──────────────────────────────────────────────────────────────

/** The last `count` days ending today, oldest first. */
export function lastDays(count: number): { iso: string; dayName: string }[] {
  return Array.from({ length: count }, (_, i) => {
    const iso = daysFromToday(i - (count - 1));
    return { iso, dayName: getPersianDayName(iso) };
  });
}

/** The next `count` days starting today. */
export function nextDays(count: number): string[] {
  return Array.from({ length: count }, (_, i) => daysFromToday(i));
}
