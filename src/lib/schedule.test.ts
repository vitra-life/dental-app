import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL_SLOTS, addMinutes, bookedSlots, findFreeSlots } from './schedule';

const booking = (date: string, start: string, end: string, status = 'confirmed') => ({
  appointment_date: date,
  start_time: `${start}:00`,
  end_time: `${end}:00`,
  status: status as 'confirmed' | 'cancelled',
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-01T08:30:00Z'));
});
afterEach(() => {
  vi.useRealTimers();
});

describe('slots', () => {
  it('covers the working day in half-hour steps', () => {
    expect(ALL_SLOTS).toHaveLength(18);
    expect(ALL_SLOTS[0]).toBe('09:00');
    expect(ALL_SLOTS[17]).toBe('17:30');
  });

  it('adds minutes to a time', () => {
    expect(addMinutes('09:00', 30)).toBe('09:30');
    expect(addMinutes('09:45', 45)).toBe('10:30');
    expect(addMinutes('23:30', 60)).toBe('00:30');
  });
});

describe('bookedSlots', () => {
  it('marks every slot an appointment overlaps', () => {
    const booked = bookedSlots([booking('2026-10-01', '09:00', '10:30')]);
    expect([...booked]).toEqual(['09:00', '09:30', '10:00']);
  });

  it('ignores cancelled appointments and counts overlaps once', () => {
    const booked = bookedSlots([
      booking('2026-10-01', '09:00', '10:00'),
      booking('2026-10-01', '09:30', '10:00'),
      booking('2026-10-01', '14:00', '15:00', 'cancelled'),
    ]);
    expect(booked.size).toBe(2);
  });
});

describe('findFreeSlots', () => {
  it('returns the earliest free slots, starting today', () => {
    const slots = findFreeSlots([booking('2026-10-01', '09:00', '10:00')], 7, 3);
    expect(slots).toEqual([
      { date: '2026-10-01', time: '10:00', dayName: 'پنجشنبه' },
      { date: '2026-10-01', time: '10:30', dayName: 'پنجشنبه' },
      { date: '2026-10-01', time: '11:00', dayName: 'پنجشنبه' },
    ]);
  });

  it('moves to the next day when today is full', () => {
    const [first] = findFreeSlots([booking('2026-10-01', '09:00', '18:00')], 7, 1);
    expect(first).toEqual({ date: '2026-10-02', time: '09:00', dayName: 'جمعه' });
  });
});
