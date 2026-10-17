import { currentJalaliMonth, isInJalaliMonth, jalaliMonthName, lastDays, shiftJalaliMonth } from '@/lib/date';
import { revenueByMonth } from '@/lib/revenue';
import * as db from '@/lib/store';
import type { Appointment, Patient, Service, TreatmentPlan } from '@/lib/types';

export interface ReportStats {
  totalRevenue: number;
  pendingPayments: number;
  totalPatients: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  /** Invoiced totals for the last 6 Jalali months, oldest first. */
  monthlyRevenue: { month: string; amount: number }[];
  /** Appointments per day for the last 7 days, oldest first. */
  weeklyAppointments: { day: string; count: number }[];
  /** The six services with the most completed visits. */
  serviceStats: { name: string; count: number; revenue: number }[];
  staffStats: { name: string; appointments: number; color: string }[];
  activePlans: number;
  /** New patients and appointments in each of the last 6 Jalali months, oldest first. */
  monthlyActivity: { month: string; newPatients: number; appointments: number }[];
  /** Every treatment plan with its patient and items, newest first. */
  plans: TreatmentPlan[];
}

/** The data that comes from the API; invoices, staff and plans are read from the browser store. */
export interface ReportInput {
  patients: Patient[];
  /** The appointments the reports cover (the shared window: about the last 7 months and the next 90 days). */
  appointments: Appointment[];
  services: Service[];
}

export function loadReportStats({ patients, appointments, services }: ReportInput): ReportStats {
  const invoices = db.list('invoices');
  const planRows = db.orderBy(db.list('treatment_plans'), 'created_at', { ascending: false });
  const plans = db.withMany(db.joinOne(planRows, 'patient', patients, 'patient_id'), 'items', 'treatment_plan_items', 'plan_id');
  const months = Array.from({ length: 6 }, (_, i) => shiftJalaliMonth(currentJalaliMonth(), i - 5));
  const completed = appointments.filter((a) => a.status === 'completed').length;

  // Completed visits per service, busiest first.
  const serviceStats = services
    .map((svc) => {
      const visits = appointments.filter((a) => a.status === 'completed' && a.service_id === svc.id);
      return { name: svc.name, count: visits.length, revenue: visits.reduce((sum, a) => sum + (a.price || 0), 0) };
    })
    .filter((s) => s.count > 0)
    .sort((x, y) => y.count - x.count)
    .slice(0, 6);

  return {
    totalRevenue: invoices.reduce((s, i) => s + (i.paid_amount || 0), 0),
    pendingPayments: invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + (i.balance || 0), 0),
    totalPatients: patients.length,
    totalAppointments: appointments.length,
    completedAppointments: completed,
    cancelledAppointments: appointments.filter((a) => a.status === 'cancelled').length,
    monthlyRevenue: revenueByMonth(invoices, 6),
    weeklyAppointments: lastDays(7).map(({ iso, dayName }) => ({
      day: dayName,
      count: appointments.filter((a) => a.appointment_date === iso).length,
    })),
    serviceStats,
    staffStats: db.list('staff').map((s) => ({
      name: s.full_name,
      appointments: appointments.filter((a) => a.staff_id === s.id).length,
      color: s.color || '#3b82f6',
    })),
    activePlans: plans.filter((p) => p.status === 'active').length,
    monthlyActivity: months.map((month) => ({
      month: jalaliMonthName(month),
      newPatients: patients.filter((p) => isInJalaliMonth(p.created_at, month)).length,
      appointments: appointments.filter((a) => isInJalaliMonth(a.appointment_date, month)).length,
    })),
    plans,
  };
}
