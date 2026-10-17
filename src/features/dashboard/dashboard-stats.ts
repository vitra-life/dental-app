import * as db from '@/lib/store';
import { patientBalances } from '@/lib/patient-balance';
import { currentJalaliMonth, formatJalaliMonth, isInJalaliMonth, lastDays, todayISO } from '@/lib/date';
import { revenueByMonth } from '@/lib/revenue';
import { clinicWorkingHours, freeSlotsOn } from '@/lib/schedule';
import type { Appointment, Patient, Service } from '@/lib/types';

export interface DashboardStats {
  todayAppointments: number;
  confirmedToday: number;
  totalPatients: number;
  /** Patients with at least one appointment. */
  activePatients: number;
  /** Payments received in the current Jalali month, and that month's name. */
  monthReceived: number;
  monthLabel: string;
  /** What open invoices still owe, and how many invoices that is. */
  pendingPayments: number;
  openInvoices: number;
  /** Invoiced totals for the last 6 Jalali months, oldest first. */
  monthlyRevenue: { month: string; amount: number }[];
  /** Appointments per service category over the last 30 days, largest first. */
  serviceShare: { category: string; count: number }[];
  /** Appointments per day for the last 7 days, oldest first. */
  week: { day: string; count: number }[];
  /** Today's first appointments, with patient and service attached. */
  todayList: Appointment[];
  activePlans: number;
  /** Active plans with work still planned, and the estimated cost of that work. */
  unfinishedPlans: number;
  unfinishedPlanValue: number;
  debtors: number;
  totalDebt: number;
  freeSlotsToday: number;
}

/** The data that comes from the API; the rest is read from the browser store. */
export interface DashboardInput {
  patients: Patient[];
  /** Appointments with their patient and service attached, as `useAppointments` returns them. */
  appointments: Appointment[];
  services: Service[];
}

export function loadDashboardStats({ patients, appointments, services }: DashboardInput): DashboardStats {
  const today = todayISO();
  const invoices = db.list('invoices');
  const plans = db.withMany(db.list('treatment_plans', (p) => p.status === 'active'), 'items', 'treatment_plan_items', 'plan_id');

  const todayAppts = db.orderBy(appointments.filter((a) => a.appointment_date === today), 'start_time');

  const month = currentJalaliMonth();
  const openInvoices = invoices.filter((i) => i.status !== 'paid');
  const balances = patientBalances();
  const debtors = patients.filter((p) => (balances.get(p.id) ?? 0) > 0);

  const since = lastDays(30)[0].iso;
  const categories = new Map(services.map((s) => [s.id, s.category]));
  const byCategory = new Map<string, number>();
  for (const apt of appointments) {
    if (apt.appointment_date < since || apt.appointment_date > today || !apt.service_id) continue;
    const category = categories.get(apt.service_id);
    if (category) byCategory.set(category, (byCategory.get(category) ?? 0) + 1);
  }

  const unfinished = plans
    .map((plan) => plan.items.filter((i) => i.status === 'planned'))
    .filter((planned) => planned.length > 0);

  return {
    todayAppointments: todayAppts.length,
    confirmedToday: todayAppts.filter((a) => a.status === 'confirmed').length,
    totalPatients: patients.length,
    activePatients: new Set(appointments.map((a) => a.patient_id)).size,
    monthReceived: db.list('payments', (p) => isInJalaliMonth(p.payment_date, month)).reduce((sum, p) => sum + p.amount, 0),
    monthLabel: formatJalaliMonth(month),
    pendingPayments: openInvoices.reduce((sum, i) => sum + (i.balance || 0), 0),
    openInvoices: openInvoices.length,
    monthlyRevenue: revenueByMonth(invoices, 6),
    serviceShare: [...byCategory].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
    week: lastDays(7).map(({ iso, dayName }) => ({ day: dayName, count: appointments.filter((a) => a.appointment_date === iso).length })),
    todayList: todayAppts.slice(0, 6),
    activePlans: plans.length,
    unfinishedPlans: unfinished.length,
    unfinishedPlanValue: unfinished.reduce((sum, planned) => sum + planned.reduce((s, i) => s + i.estimated_cost, 0), 0),
    debtors: debtors.length,
    totalDebt: debtors.reduce((sum, p) => sum + (balances.get(p.id) ?? 0), 0),
    freeSlotsToday: freeSlotsOn(today, todayAppts, clinicWorkingHours()).length,
  };
}
