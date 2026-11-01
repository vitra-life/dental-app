import type { PageKey } from '@/lib/types';

/**
 * The permission catalogue codes the app checks (the backend's
 * `permission-catalog.ts` defines them). Pages gate the menu and routes;
 * actions gate buttons. The backend enforces the same codes on its endpoints.
 */

/** The page permission behind each screen. */
export const PAGE_PERMISSION: Record<PageKey, string> = {
  dashboard: 'dashboard',
  patients: 'clients',
  appointments: 'appointments',
  billing: 'billing',
  lab: 'lab',
  reports: 'reports',
  ai: 'assistant',
  sms: 'sms',
  settings: 'settings',
};

export const CAN = {
  createClient: 'clients.record.create',
  updateClient: 'clients.record.update',
  bookAppointment: 'appointments.booking.create',
  changeAppointmentStatus: 'appointments.status.change',
  cancelAppointment: 'appointments.status.cancel',
  manageServices: 'settings.services.manage',
  settingsClinic: 'settings.clinic',
  settingsHours: 'settings.hours',
  settingsServices: 'settings.services',
  settingsStaff: 'settings.staff',
  settingsPlans: 'settings.plans',
} as const;
