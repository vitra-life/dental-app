import { useState, useEffect, useMemo } from 'react';
import { CalendarDays, CheckCircle2, Clock, Hourglass, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatTile } from '@/components/ui/stat-tile';
import { Tabs, type TabItem } from '@/components/ui/tabs';
import { currentJalaliMonth, todayISO, type JalaliMonth } from '@/lib/date';
import { formatNumber } from '@/lib/format';
import { bookedSlots, clinicWorkingHours, freeSlotsOn, workingSlots } from '@/lib/schedule';
import { useAppointments, useSetAppointmentStatus } from '@/data/appointments';
import { usePatients } from '@/data/patients';
import { useServices } from '@/data/services';
import { useCan } from '@/data/session';
import { CAN } from '@/lib/permissions';
import { errorMessage } from '@/lib/api/errors';
import { showToast } from '@/lib/toast';
import { plannedAppointmentIds, syncPlanWithAppointment } from '@/lib/treatment-plans';
import type { Appointment, WorkingHours } from '@/lib/types';
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
  /** Appointments in the shared window, by date then start time, with patient and service attached. */
  const { data: appointments = [], isPending: loading } = useAppointments();
  const { data: allPatients = [] } = usePatients();
  const { data: allServices = [] } = useServices();
  const setStatus = useSetAppointmentStatus();
  const patients = useMemo(() => [...allPatients].sort((a, b) => a.first_name.localeCompare(b.first_name, 'fa')), [allPatients]);
  const services = useMemo(() => allServices.filter((s) => s.active), [allServices]);
  const [hours, setHours] = useState<WorkingHours | null>(null);
  /** Appointments that were booked for a treatment-plan item. */
  const [planned, setPlanned] = useState<Set<string>>(() => new Set());
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [calendarMonth, setCalendarMonth] = useState<JalaliMonth>(currentJalaliMonth);
  /** Date and start time of the booking form while it is open. */
  const [booking, setBooking] = useState<{ date: string; startTime: string } | null>(null);

  /** Working hours and plan links live in the browser store. */
  function loadLocal() {
    setHours(clinicWorkingHours());
    setPlanned(plannedAppointmentIds());
  }

  useEffect(loadLocal, []);

  async function updateStatus(id: string, status: Exclude<Appointment['status'], 'pending'>) {
    try {
      const updated = await setStatus.mutateAsync({ id, status });
      syncPlanWithAppointment(updated, status);
      loadLocal();
      showToast('وضعیت نوبت بروزرسانی شد');
    } catch (error) {
      showToast(errorMessage(error), 'error');
    }
  }

  const today = todayISO();
  const dayStats = useMemo(() => summarizeDays(appointments, hours), [appointments, hours]);
  const todayAppointments = useMemo(() => appointments.filter((a) => a.appointment_date === today), [appointments, today]);
  const dayAppointments = useMemo(() => appointments.filter((a) => a.appointment_date === selectedDate), [appointments, selectedDate]);
  const booked = useMemo(() => bookedSlots(dayAppointments), [dayAppointments]);
  const daySlots = useMemo(() => workingSlots(selectedDate, hours), [selectedDate, hours]);
  const todaySlots = workingSlots(today, hours);
  const todayFree = freeSlotsOn(today, todayAppointments, hours).length;

  const canBook = useCan(CAN.bookAppointment);
  const openBooking = (startTime = '09:00', date = viewMode === 'list' ? today : selectedDate) => {
    if (canBook) setBooking({ date, startTime });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="نوبت‌دهی" subtitle={<>{formatNumber(todayAppointments.length)} نوبت امروز</>}>
        {canBook && (
          <button onClick={() => openBooking()} className="btn-primary">
            <Plus size={16} />
            نوبت جدید
          </button>
        )}
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
          onClose={() => setBooking(null)}
          onSaved={() => { setBooking(null); loadLocal(); }}
        />
      )}
    </div>
  );
}
