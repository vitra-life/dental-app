import { lastDays } from '@/lib/date';
import { revenueByMonth } from '@/lib/revenue';
import * as db from '@/lib/store';

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
  serviceStats: { name: string; count: number; revenue: number }[];
  staffStats: { name: string; appointments: number; color: string }[];
}

export function loadReportStats(): ReportStats {
  const invoices = db.list('invoices');
  const appointments = db.list('appointments');
  const services = db.list('services');
  const completed = appointments.filter((a) => a.status === 'completed').length;

  // Appointments are not broken down by service here: completed visits are spread evenly over the catalogue.
  const perService = Math.floor(completed / (services.length || 1));

  return {
    totalRevenue: invoices.reduce((s, i) => s + (i.paid_amount || 0), 0),
    pendingPayments: invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + (i.balance || 0), 0),
    totalPatients: db.list('patients').length,
    totalAppointments: appointments.length,
    completedAppointments: completed,
    cancelledAppointments: appointments.filter((a) => a.status === 'cancelled').length,
    monthlyRevenue: revenueByMonth(invoices, 6),
    weeklyAppointments: lastDays(7).map(({ iso, dayName }) => ({
      day: dayName,
      count: appointments.filter((a) => a.appointment_date === iso).length,
    })),
    serviceStats: services.slice(0, 6).map((svc) => ({ name: svc.name, count: perService, revenue: svc.default_price * perService })),
    staffStats: db.list('staff').map((s) => ({
      name: s.full_name,
      appointments: appointments.filter((a) => a.staff_id === s.id).length,
      color: s.color || '#3b82f6',
    })),
  };
}
