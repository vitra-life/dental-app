import { useState } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { appointmentStatus, statusStyle } from '@/constants/status';
import { formatDateShort, getPersianDayName, todayISO } from '@/lib/date';
import { formatNumber, formatClock, fullName } from '@/lib/format';
import type { Appointment } from '@/lib/types';

interface AppointmentListViewProps {
  /** Every appointment, oldest first. */
  appointments: Appointment[];
  /** Ids of the appointments booked for a treatment-plan item. */
  planned: Set<string>;
  loading: boolean;
  onNew: () => void;
  onStatusChange: (id: string, status: Appointment['status']) => void;
  onOpenPatient: (patientId: string) => void;
}

type Period = 'upcoming' | 'past';
type StatusFilter = 'all' | Appointment['status'];

const periods: { value: Period; label: string }[] = [
  { value: 'upcoming', label: 'امروز و آینده' },
  { value: 'past', label: 'گذشته' },
];

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'همه' },
  ...(['pending', 'confirmed', 'completed', 'cancelled'] as const).map((value) => ({ value, label: appointmentStatus[value].label })),
];

/** Minutes between two `HH:MM[:SS]` times. */
function duration(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

/** All appointments as a filterable list, with the status actions on each row. */
export function AppointmentListView({ appointments, planned, loading, onNew, onStatusChange, onOpenPatient }: AppointmentListViewProps) {
  const [period, setPeriod] = useState<Period>('upcoming');
  const [status, setStatus] = useState<StatusFilter>('all');
  const today = todayISO();

  const inPeriod = period === 'upcoming' ? appointments.filter((a) => a.appointment_date >= today) : appointments.filter((a) => a.appointment_date < today).reverse();
  const filtered = status === 'all' ? inPeriod : inPeriod.filter((a) => a.status === status);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <ChoiceChips options={periods} value={period} onChange={setPeriod} />
        <span className="hidden sm:block w-px h-5 bg-surface-200" />
        <ChoiceChips options={statusFilters} value={status} onChange={setStatus} />
      </div>

      {loading ? (
        <div className="space-y-2">
          <SkeletonList count={4} className="h-20" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="نوبتی یافت نشد"
          description="فیلترها را تغییر دهید یا نوبت جدیدی ثبت کنید"
          action={<button onClick={onNew} className="btn-primary"><Plus size={16} />نوبت جدید</button>}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((apt) => (
            <div key={apt.id} className="card p-4 flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-3">
              <div className="text-center shrink-0 w-20">
                <p className="text-xs text-surface-400">{apt.appointment_date === today ? 'امروز' : `${getPersianDayName(apt.appointment_date)} ${formatDateShort(apt.appointment_date)}`}</p>
                <p className="text-base font-bold text-surface-800">{formatClock(apt.start_time)}</p>
                <p className="text-xs text-surface-400">{formatNumber(duration(apt.start_time, apt.end_time))} دقیقه</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button onClick={() => onOpenPatient(apt.patient_id)} className="text-sm font-semibold text-surface-800 hover:text-primary-600 transition-colors">
                    {fullName(apt.patient)}
                  </button>
                  {planned.has(apt.id) && <span className="text-xs bg-primary-50 text-primary-600 border border-primary-200 px-1.5 py-0.5 rounded-lg whitespace-nowrap">طرح درمان</span>}
                </div>
                <p className="text-xs text-surface-500 mt-0.5 truncate">
                  {apt.service?.name || 'نوبت عمومی'} · {apt.staff?.full_name || 'بدون دکتر'}
                </p>
                {apt.notes && <p className="text-xs text-surface-400 mt-1 truncate">{apt.notes}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                <StatusBadge status={statusStyle(appointmentStatus, apt.status, 'pending')} />
                {apt.status === 'pending' && (
                  <button onClick={() => onStatusChange(apt.id, 'confirmed')} className="btn-chip px-2 py-1 bg-accent-50 text-accent-700 border-accent-200 hover:bg-accent-100">تأیید</button>
                )}
                {(apt.status === 'pending' || apt.status === 'confirmed') && (
                  <>
                    <button onClick={() => onStatusChange(apt.id, 'completed')} className="btn-chip px-2 py-1 bg-surface-50 text-surface-600 border-surface-200 hover:bg-surface-100">انجام شد</button>
                    <button onClick={() => onStatusChange(apt.id, 'cancelled')} className="btn-chip px-2 py-1 bg-error-50 text-error-600 border-error-200 hover:bg-error-100">لغو</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
