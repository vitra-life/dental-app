import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addDaysISO,
  daysFromToday,
  daysUntil,
  formatDate,
  formatDateNumeric,
  formatDateShort,
  formatJalaliMonth,
  getAge,
  getPersianDayName,
  isInJalaliMonth,
  jalaliDay,
  jalaliMonthGrid,
  jalaliMonthOf,
  lastDays,
  parseJalaliDate,
  shiftJalaliMonth,
  todayISO,
} from './date';

// Thursday 1 October 2026 = 9 Mehr 1405. The test time zone is Asia/Tehran (UTC+3:30).
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-01T08:30:00Z'));
});
afterEach(() => {
  vi.useRealTimers();
});

describe('Gregorian storage values', () => {
  it('uses the local calendar day, not the UTC one', () => {
    // 01:00 in Tehran on 2 October is still 1 October in UTC.
    vi.setSystemTime(new Date('2026-10-01T21:30:00Z'));
    expect(todayISO()).toBe('2026-10-02');
  });

  it('offsets days from today', () => {
    expect(daysFromToday(0)).toBe('2026-10-01');
    expect(daysFromToday(-1)).toBe('2026-09-30');
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('counts whole days until a date', () => {
    expect(daysUntil('2026-10-01')).toBe(0);
    expect(daysUntil('2026-10-06')).toBe(5);
    expect(daysUntil('2026-09-21')).toBe(-10);
  });

  it('computes age from a birth date', () => {
    expect(getAge('1985-04-12')).toBe(41);
    expect(getAge('1985-10-02')).toBe(40);
  });

  it('lists the last days oldest first, ending today', () => {
    const days = lastDays(7);
    expect(days).toHaveLength(7);
    expect(days[0].iso).toBe('2026-09-25');
    expect(days[6]).toEqual({ iso: '2026-10-01', dayName: 'پنجشنبه' });
  });
});

describe('Jalali display', () => {
  it('formats dates in the Persian calendar with Persian digits', () => {
    expect(formatDate('2026-10-01')).toBe('۹ مهر ۱۴۰۵');
    expect(formatDateShort('2026-10-01')).toBe('۹ مهر');
    expect(formatDateNumeric('2026-10-01')).toBe('۱۴۰۵/۰۷/۰۹');
    expect(formatDate('2026-03-21')).toBe('۱ فروردین ۱۴۰۵');
  });

  it('accepts timestamps and Date objects', () => {
    expect(formatDate('2026-10-01T08:30:00.000Z')).toBe('۹ مهر ۱۴۰۵');
    expect(formatDate(new Date(2026, 9, 1))).toBe('۹ مهر ۱۴۰۵');
  });

  it('names weekdays in a week that starts on Saturday', () => {
    expect(getPersianDayName('2026-10-01')).toBe('پنجشنبه');
    expect(getPersianDayName('2026-10-03')).toBe('شنبه');
  });

  it('gives the day of the Jalali month', () => {
    expect(jalaliDay('2026-10-01')).toBe(9);
  });
});

describe('Jalali months', () => {
  const mehr1405 = { jy: 1405, jm: 6 };

  it('finds the month of a date', () => {
    expect(jalaliMonthOf('2026-10-01')).toEqual(mehr1405);
    expect(formatJalaliMonth(mehr1405)).toBe('مهر ۱۴۰۵');
    expect(isInJalaliMonth('2026-09-23', mehr1405)).toBe(true);
    expect(isInJalaliMonth('2026-09-22', mehr1405)).toBe(false);
  });

  it('shifts across year boundaries', () => {
    expect(shiftJalaliMonth({ jy: 1405, jm: 11 }, 1)).toEqual({ jy: 1406, jm: 0 });
    expect(shiftJalaliMonth({ jy: 1405, jm: 0 }, -1)).toEqual({ jy: 1404, jm: 11 });
    expect(shiftJalaliMonth(mehr1405, -12)).toEqual({ jy: 1404, jm: 6 });
  });

  it('builds a Saturday-first calendar grid', () => {
    // 1 Mehr 1405 is Wednesday 23 September 2026: four blanks, then 30 days.
    const grid = jalaliMonthGrid(mehr1405);
    expect(grid.slice(0, 4)).toEqual([null, null, null, null]);
    expect(grid[4]).toBe('2026-09-23');
    expect(grid).toHaveLength(34);
    expect(grid[grid.length - 1]).toBe('2026-10-22');
  });
});

describe('parseJalaliDate', () => {
  it('reads Latin and Persian digits and several separators', () => {
    expect(parseJalaliDate('1405/7/9')).toBe('2026-10-01');
    expect(parseJalaliDate('۱۴۰۵/۰۷/۰۹')).toBe('2026-10-01');
    expect(parseJalaliDate(' 1405-07-09 ')).toBe('2026-10-01');
  });

  it('knows leap years', () => {
    expect(parseJalaliDate('1403/12/30')).toBe('2025-03-20');
    expect(parseJalaliDate('1404/12/30')).toBeNull();
  });

  it('rejects anything that is not a real date', () => {
    expect(parseJalaliDate('')).toBeNull();
    expect(parseJalaliDate('1405/13/1')).toBeNull();
    expect(parseJalaliDate('1405/7/31')).toBeNull();
    expect(parseJalaliDate('hello')).toBeNull();
  });
});
