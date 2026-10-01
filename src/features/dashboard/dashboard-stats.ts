import * as db from '@/lib/store';
import { lastDays, todayISO } from '@/lib/date';
import { formatCurrency, formatNumber } from '@/lib/format';
import { monthOverMonth } from '@/lib/revenue';
import type { Appointment } from '@/lib/types';

export interface DashboardAlert {
  message: string;
  severity: 'warning' | 'info' | 'error';
}

export interface DashboardStats {
  todayAppointments: number;
  completedToday: number;
  totalPatients: number;
  todayRevenue: number;
  pendingPayments: number;
  /** This month's invoiced total against last month's, in percent. */
  revenueTrend: number;
  /** One entry per day for the last 7 days, oldest first. */
  week: { day: string; count: number; revenue: number }[];
  /** Today's first appointments, with patient, staff and service attached. */
  recentAppointments: Appointment[];
  alerts: DashboardAlert[];
}

const completedRevenue = (appointments: Appointment[]) =>
  appointments.filter((a) => a.status === 'completed').reduce((sum, a) => sum + (a.price || 0), 0);

export function loadDashboardStats(): DashboardStats {
  const today = todayISO();
  const appointments = db.list('appointments');
  const patients = db.list('patients');
  const invoices = db.list('invoices');
  const labOrders = db.list('lab_orders');

  let todayAppts = db.orderBy(appointments.filter((a) => a.appointment_date === today), 'start_time');
  todayAppts = db.withOne(todayAppts, 'patient', 'patients', 'patient_id');
  todayAppts = db.withOne(todayAppts, 'staff', 'staff', 'staff_id');
  todayAppts = db.withOne(todayAppts, 'service', 'services', 'service_id');

  const pendingPayments = invoices.filter((i) => i.status !== 'paid').reduce((sum, i) => sum + (i.balance || 0), 0);

  const week = lastDays(7).map(({ iso, dayName }) => {
    const dayAppts = appointments.filter((a) => a.appointment_date === iso);
    return { day: dayName, count: dayAppts.length, revenue: completedRevenue(dayAppts) };
  });

  const alerts: DashboardAlert[] = [];
  if (pendingPayments > 0) {
    alerts.push({ message: `${formatCurrency(pendingPayments)} مطالبات معوق کلینیک`, severity: 'warning' });
  }
  const openLabOrders = labOrders.filter((o) => o.status === 'pending' || o.status === 'in_progress').length;
  if (openLabOrders > 0) {
    alerts.push({ message: `${formatNumber(openLabOrders)} سفارش لابراتوار در حال پیگیری`, severity: 'info' });
  }
  const debtors = patients.filter((p) => p.balance > 0).length;
  if (debtors > 0) {
    alerts.push({ message: `${formatNumber(debtors)} بیمار بدهکار دارند`, severity: 'error' });
  }

  return {
    todayAppointments: todayAppts.length,
    completedToday: todayAppts.filter((a) => a.status === 'completed').length,
    totalPatients: patients.length,
    todayRevenue: completedRevenue(todayAppts),
    pendingPayments,
    revenueTrend: monthOverMonth(invoices).change,
    week,
    recentAppointments: todayAppts.slice(0, 6),
    alerts,
  };
}
