import { APPOINTMENT_DURATIONS, DEFAULT_APPOINTMENT_DURATION, SLOT_INTERVAL, WORK_HOURS } from '@/constants/schedule';
import { getPersianDayName, nextDays, weekdayIndex } from '@/lib/date';
import * as db from '@/lib/store';
import type { Appointment, WorkingHours } from '@/lib/types';

type Booking = Pick<Appointment, 'appointment_date' | 'start_time' | 'end_time' | 'status'>;

const pad = (n: number) => String(n).padStart(2, '0');
const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/** The slot start times from `start` up to (not including) `end`, as `HH:MM`. */
function slotsBetween(start: string, end: string): string[] {
  const slots: string[] = [];
  for (let t = toMinutes(start); t < toMinutes(end); t += SLOT_INTERVAL) {
    slots.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`);
  }
  return slots;
}

/** Every bookable slot of the default working day as `HH:MM`, in order. */
export const ALL_SLOTS: readonly string[] = slotsBetween(`${pad(WORK_HOURS.start)}:00`, `${pad(WORK_HOURS.end)}:00`);

const EVERY_SLOT = slotsBetween('00:00', '24:00');

/** Weekday keys of `WorkingHours`, in the order of a week that starts on Saturday. */
export const WEEKDAY_KEYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'] as const;

/** The default working day on every day but Friday. */
export const DEFAULT_WORKING_HOURS: WorkingHours = Object.fromEntries(
  WEEKDAY_KEYS.map((key) => [key, key === 'fri' ? null : { start: `${pad(WORK_HOURS.start)}:00`, end: `${pad(WORK_HOURS.end)}:00` }]),
);

/** The clinic's working hours from Settings; `null` when none are set. */
export function clinicWorkingHours(): WorkingHours | null {
  return db.first('clinic_settings')?.working_hours ?? null;
}

/**
 * The bookable slots of a date: that weekday's opening hours, or none when the
 * clinic is closed. Without `hours`, every day is a default working day.
 */
export function workingSlots(date: string, hours: WorkingHours | null): readonly string[] {
  if (!hours) return ALL_SLOTS;
  const day = hours[WEEKDAY_KEYS[weekdayIndex(date)]];
  return day ? slotsBetween(day.start, day.end) : [];
}

/** A service's usual length if it is one of the bookable durations, else the default (30 minutes). */
export function bookableDuration(serviceMinutes: number | undefined): number {
  return (APPOINTMENT_DURATIONS as readonly number[]).includes(serviceMinutes ?? -1) ? serviceMinutes! : DEFAULT_APPOINTMENT_DURATION;
}

/** `HH:MM` plus a number of minutes, wrapping at midnight. */
export function addMinutes(time: string, minutes: number): string {
  const total = toMinutes(time) + minutes;
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

/** The slots taken by the given appointments. Cancelled appointments free their slots. */
export function bookedSlots(appointments: Booking[]): Set<string> {
  const booked = new Set<string>();
  for (const apt of appointments) {
    if (apt.status === 'cancelled') continue;
    const start = apt.start_time.slice(0, 5);
    const end = apt.end_time.slice(0, 5);
    for (const slot of EVERY_SLOT) {
      if (slot >= start && slot < end) booked.add(slot);
    }
  }
  return booked;
}

/** The working slots of `date` that none of that day's appointments take. */
export function freeSlotsOn(date: string, dayAppointments: Booking[], hours: WorkingHours | null): string[] {
  const booked = bookedSlots(dayAppointments);
  return workingSlots(date, hours).filter((slot) => !booked.has(slot));
}

export interface FreeSlot {
  date: string;
  time: string;
  dayName: string;
}

/** The first `limit` free slots over the next `days` days, starting today. */
export function findFreeSlots(appointments: Booking[], days: number, limit: number, hours: WorkingHours | null = null): FreeSlot[] {
  const free: FreeSlot[] = [];
  for (const date of nextDays(days)) {
    for (const time of freeSlotsOn(date, appointments.filter((a) => a.appointment_date === date), hours)) {
      free.push({ date, time, dayName: getPersianDayName(date) });
      if (free.length >= limit) return free;
    }
  }
  return free;
}
