import { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, Clock, Grid3x3, List, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { MiniStat } from '@/components/ui/stat-tile';
import { currentJalaliMonth, todayISO, type JalaliMonth } from '@/lib/date';
import { formatNumber } from '@/lib/format';
import { ALL_SLOTS, bookedSlots } from '@/lib/schedule';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { Appointment, Patient, Service, Staff } from '@/lib/types';
import { AppointmentCalendarView, type DayStats } from './appointment-calendar-view';
import { AppointmentForm } from './appointment-form';
import { AppointmentListView } from './appointment-list-view';

interface AppointmentsProps {
  onOpenPatient: (patientId: string) => void;
}

/** Appointment count and free slots for every day that has at least one appointment. */
function summarizeDays(): DayStats {
  const byDate = new Map<string, Appointment[]>();
  for (const apt of db.list('appointments')) {
    byDate.set(apt.appointment_date, [...(byDate.get(apt.appointment_date) ?? []), apt]);
  }
  const stats: DayStats = {};
  for (const [date, appts] of byDate) {
    stats[date] = { count: appts.length, emptySlots: ALL_SLOTS.length - bookedSlots(appts).size };
  }
  return stats;
}

export function Appointments({ onOpenPatient }: AppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [dayStats, setDayStats] = useState<DayStats>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState<JalaliMonth>(currentJalaliMonth);
  /** Start time of the booking form while it is open. */
  const [formStart, setFormStart] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    let appts = db.orderBy(db.list('appointments', (a) => a.appointment_date === selectedDate), 'start_time');
    appts = db.withOne(appts, 'patient', 'patients', 'patient_id');
    appts = db.withOne(appts, 'staff', 'staff', 'staff_id');
    appts = db.withOne(appts, 'service', 'services', 'service_id');
    setAppointments(appts);
    setDayStats(summarizeDays());
    setPatients(db.orderBy(db.list('patients'), 'first_name'));
    setServices(db.list('services', (s) => s.active));
    setStaffList(db.list('staff', (s) => s.active));
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => { load(); }, [load]);

  function updateStatus(id: string, status: Appointment['status']) {
    db.update('appointments', id, { status });
    showToast('وضعیت نوبت بروزرسانی شد');
    load();
  }

  const booked = useMemo(() => bookedSlots(appointments), [appointments]);

  return (
    <div className="space-y-6">
      <PageHeader title="نوبت‌دهی" subtitle="مدیریت نوبت‌های کلینیک">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white rounded-xl border border-surface-200 p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-surface-400 hover:bg-surface-50'}`}
              title="نمایش لیست"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'calendar' ? 'bg-primary-50 text-primary-600' : 'text-surface-400 hover:bg-surface-50'}`}
              title="نمایش تقویم"
            >
              <Grid3x3 size={18} />
            </button>
          </div>
          <button onClick={() => setFormStart('09:00')} className="btn-primary">
            <Plus size={18} />
            نوبت جدید
          </button>
        </div>
      </PageHeader>

      {/* Selected day's summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat label="نوبت‌های امروز" icon={CalendarDays} tone="primary">
          {formatNumber(appointments.length)}
        </MiniStat>
        <MiniStat label="تکمیل شده" icon={CheckCircle2} tone="accent" delay={50}>
          {formatNumber(appointments.filter((a) => a.status === 'completed').length)}
        </MiniStat>
        <MiniStat label="در انتظار" icon={Clock} tone="warning" delay={100}>
          {formatNumber(appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed').length)}
        </MiniStat>
        <MiniStat label="ساعات خالی" icon={AlertCircle} tone="secondary" delay={150}>
          {formatNumber(ALL_SLOTS.length - booked.size)} <span className="text-xs font-normal text-surface-400">از {formatNumber(ALL_SLOTS.length)}</span>
        </MiniStat>
      </div>

      {viewMode === 'calendar' ? (
        <AppointmentCalendarView
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          dayStats={dayStats}
          appointments={appointments}
          loading={loading}
        />
      ) : (
        <AppointmentListView
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          appointments={appointments}
          booked={booked}
          loading={loading}
          onNew={(startTime = '09:00') => setFormStart(startTime)}
          onStatusChange={updateStatus}
          onOpenPatient={onOpenPatient}
        />
      )}

      {formStart && (
        <AppointmentForm
          date={selectedDate}
          startTime={formStart}
          patients={patients}
          services={services}
          staffList={staffList}
          onClose={() => setFormStart(null)}
          onSaved={() => { setFormStart(null); load(); }}
        />
      )}
    </div>
  );
}
