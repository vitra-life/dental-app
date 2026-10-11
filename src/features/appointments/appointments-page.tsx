import { useState, useEffect, useCallback, useMemo } from 'react';
import { CalendarDays, CheckCircle2, Clock, Hourglass, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatTile } from '@/components/ui/stat-tile';
import { Tabs, type TabItem } from '@/components/ui/tabs';
import { currentJalaliMonth, todayISO, type JalaliMonth } from '@/lib/date';
import { formatNumber } from '@/lib/format';
import { bookedSlots, clinicWorkingHours, freeSlotsOn, workingSlots } from '@/lib/schedule';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import { plannedAppointmentIds, syncPlanWithAppointment } from '@/lib/treatment-plans';
import type { Appointment, Patient, Service, Staff, WorkingHours } from '@/lib/types';
import { AppointmentCalendarView, type DayStats } from './appointment-calendar-view';
import { AppointmentDayView } from './appointment-day-view';
import { AppointmentForm } from './appointment-form';
import { AppointmentListView } from './appointment-list-view';

interface AppointmentsProps {
  onOpenPatient: (patientId: string) => void;
}

type ViewMode = 'list' | 'day' | 'calendar';

const views: TabItem<ViewMode>[] = [
  { key: 'list', label: 'لیست' },
  { key: 'day', label: 'روز' },
  { key: 'calendar', label: 'تقویم' },
];

/** Appointment count and free slots for every day that has at least one appointment. */
function summarizeDays(appointments: Appointment[], hours: WorkingHours | null): DayStats {
  const byDate = new Map<string, Appointment[]>();
  for (const apt of appointments) {
    byDate.set(apt.appointment_date, [...(byDate.get(apt.appointment_date) ?? []), apt]);
  }
  const stats: DayStats = {};
  for (const [date, appts] of byDate) {
    stats[date] = { count: appts.length, emptySlots: freeSlotsOn(date, appts, hours).length };
  }
  return stats;
}

export function Appointments({ onOpenPatient }: AppointmentsProps) {
  /** Every appointment, by date then start time, with patient, staff and service attached. */
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [hours, setHours] = useState<WorkingHours | null>(null);
  /** Appointments that were booked for a treatment-plan item. */
  const [planned, setPlanned] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [calendarMonth, setCalendarMonth] = useState<JalaliMonth>(currentJalaliMonth);
  /** Date and start time of the booking form while it is open. */
  const [booking, setBooking] = useState<{ date: string; startTime: string } | null>(null);

  const load = useCallback(() => {
    let appts = db.orderBy(db.orderBy(db.list('appointments'), 'start_time'), 'appointment_date');
    appts = db.withOne(appts, 'patient', 'patients', 'patient_id');
    appts = db.withOne(appts, 'staff', 'staff', 'staff_id');
    appts = db.withOne(appts, 'service', 'services', 'service_id');
    setAppointments(appts);
    setPatients(db.orderBy(db.list('patients'), 'first_name'));
    setServices(db.list('services', (s) => s.active));
    setStaffList(db.list('staff', (s) => s.active));
    setHours(clinicWorkingHours());
    setPlanned(plannedAppointmentIds());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function updateStatus(id: string, status: Appointment['status']) {
    const updated = db.update('appointments', id, { status });
    if (updated) syncPlanWithAppointment(updated, status);
    showToast('وضعیت نوبت بروزرسانی شد');
    load();
  }

  const today = todayISO();
  const dayStats = useMemo(() => summarizeDays(appointments, hours), [appointments, hours]);
  const todayAppointments = useMemo(() => appointments.filter((a) => a.appointment_date === today), [appointments, today]);
  const dayAppointments = useMemo(() => appointments.filter((a) => a.appointment_date === selectedDate), [appointments, selectedDate]);
  const booked = useMemo(() => bookedSlots(dayAppointments), [dayAppointments]);
  const daySlots = useMemo(() => workingSlots(selectedDate, hours), [selectedDate, hours]);
  const todaySlots = workingSlots(today, hours);
  const todayFree = freeSlotsOn(today, todayAppointments, hours).length;

  const openBooking = (startTime = '09:00', date = viewMode === 'list' ? today : selectedDate) => setBooking({ date, startTime });

  return (
    <div className="space-y-5">
      <PageHeader title="نوبت‌دهی" subtitle={<>{formatNumber(todayAppointments.length)} نوبت امروز</>}>
        <button onClick={() => openBooking()} className="btn-primary">
          <Plus size={16} />
          نوبت جدید
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="نوبت‌های امروز" value={formatNumber(todayAppointments.length)} icon={CalendarDays} tone="primary" />
        <StatTile label="انجام‌شده" value={formatNumber(todayAppointments.filter((a) => a.status === 'completed').length)} icon={CheckCircle2} tone="accent" />
        <StatTile label="در انتظار" value={formatNumber(todayAppointments.filter((a) => a.status === 'pending' || a.status === 'confirmed').length)} icon={Hourglass} tone="warning" />
        <StatTile label="ساعت‌های خالی امروز" value={formatNumber(todayFree)} sub={todaySlots.length > 0 ? <>از {formatNumber(todaySlots.length)} ساعت</> : 'امروز تعطیل است'} icon={Clock} tone="secondary" />
      </div>

      <Tabs tabs={views} active={viewMode} onChange={setViewMode} fit />

      {viewMode === 'list' && (
        <AppointmentListView appointments={appointments} planned={planned} loading={loading} onNew={() => openBooking()} onStatusChange={updateStatus} onOpenPatient={onOpenPatient} />
      )}
      {viewMode === 'day' && (
        <AppointmentDayView
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          dayStats={dayStats}
          appointments={dayAppointments}
          planned={planned}
          slots={daySlots}
          booked={booked}
          loading={loading}
          onNew={openBooking}
          onOpenPatient={onOpenPatient}
        />
      )}
      {viewMode === 'calendar' && (
        <AppointmentCalendarView
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          dayStats={dayStats}
          hours={hours}
          appointments={dayAppointments}
          loading={loading}
          onOpenPatient={onOpenPatient}
        />
      )}

      {booking && (
        <AppointmentForm
          date={booking.date}
          startTime={booking.startTime}
          patients={patients}
          services={services}
          staffList={staffList}
          onClose={() => setBooking(null)}
          onSaved={() => { setBooking(null); load(); }}
        />
      )}
    </div>
  );
}
