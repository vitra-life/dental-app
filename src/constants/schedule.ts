/** Clinic working hours (24h clock) used to build bookable time slots. */
export const WORK_HOURS = { start: 9, end: 18 };

/** The lengths an appointment can be booked for, in minutes (the API accepts only these). */
export const APPOINTMENT_DURATIONS = [20, 30, 45, 60, 90, 120] as const;

/** The duration a new appointment starts with. */
export const DEFAULT_APPOINTMENT_DURATION = 30;

/** Length of one bookable slot, in minutes. */
export const SLOT_INTERVAL = 30;
