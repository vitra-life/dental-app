import { SLOT_INTERVAL, WORK_HOURS } from '@/constants/schedule';
import { getPersianDayName, nextDays } from '@/lib/date';
import type { Appointment } from '@/lib/types';

type Booking = Pick<Appointment, 'appointment_date' | 'start_time' | 'end_time' | 'status'>;

function buildSlots(): string[] {
  const slots: string[] = [];
  for (let h = WORK_HOURS.start; h < WORK_HOURS.end; h++) {
    for (let m = 0; m < 60; m += SLOT_INTERVAL) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

/** Every bookable slot of a working day as `HH:MM`, in order. */
export const ALL_SLOTS: readonly string[] = buildSlots();

/** `HH:MM` plus a number of minutes, wrapping at midnight. */
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

/** The slots taken by the given appointments. Cancelled appointments free their slots. */
export function bookedSlots(appointments: Booking[]): Set<string> {
  const booked = new Set<string>();
  for (const apt of appointments) {
    if (apt.status === 'cancelled') continue;
    const start = apt.start_time.slice(0, 5);
    const end = apt.end_time.slice(0, 5);
    for (const slot of ALL_SLOTS) {
      if (slot >= start && slot < end) booked.add(slot);
    }
  }
  return booked;
}

export interface FreeSlot {
  date: string;
  time: string;
  dayName: string;
}

/** The first `limit` free slots over the next `days` days, starting today. */
export function findFreeSlots(appointments: Booking[], days: number, limit: number): FreeSlot[] {
  const free: FreeSlot[] = [];
  for (const date of nextDays(days)) {
    const booked = bookedSlots(appointments.filter((a) => a.appointment_date === date));
    for (const time of ALL_SLOTS) {
      if (booked.has(time)) continue;
      free.push({ date, time, dayName: getPersianDayName(date) });
      if (free.length >= limit) return free;
    }
  }
  return free;
}
