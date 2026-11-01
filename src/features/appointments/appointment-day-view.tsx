import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { appointmentStatus, statusStyle } from '@/constants/status';
import { addDaysISO, daysFromToday, formatDateShort, getPersianDayName, todayISO } from '@/lib/date';
import { formatNumber, formatClock, fullName } from '@/lib/format';
import type { Appointment } from '@/lib/types';
import type { DayStats } from './appointment-calendar-view';

interface AppointmentDayViewProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  dayStats: DayStats;
  /** The selected day's appointments, in time order. */
  appointments: Appointment[];
  /** Ids of the appointments booked for a treatment-plan item. */
  planned: Set<string>;
  /** The selected day's working slots; empty when the clinic is closed. */
  slots: readonly string[];
  /** Slots already taken on the selected day. */
  booked: Set<string>;
  loading: boolean;
  /** Opens the booking form for the selected day, optionally at a start time. */
  onNew: (startTime?: string) => void;
  onOpenPatient: (patientId: string) => void;
}

const relativeDays: Record<number, string> = { [-1]: 'دیروز', 0: 'امروز', 1: 'فردا', 2: 'پس‌فردا' };

/** One day at a time: a strip of nearby days, the free slots, and the day's appointments. */
export function AppointmentDayView({ selectedDate, onSelectDate, dayStats, appointments, planned, slots, booked, loading, onNew, onOpenPatient }: AppointmentDayViewProps) {
  const today = todayISO();
  const free = slots.filter((slot) => !booked.has(slot)).length;
  const strip = [-1, 0, 1, 2, 3, 4, 5].map((offset) => ({ date: daysFromToday(offset), offset }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => onSelectDate(addDaysISO(selectedDate, -1))} title="روز قبل" className="p-2 rounded-xl bg-white border border-surface-200 text-surface-500 hover:bg-surface-50 shrink-0">
          <ChevronRight size={16} />
        </button>
        <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
          {strip.map(({ date, offset }) => (
            <button
              key={date}
              onClick={() => onSelectDate(date)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedDate === date ? 'bg-primary-600 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'
              }`}
            >
              {relativeDays[offset] ?? `${getPersianDayName(date)} ${formatDateShort(date)}`} ({formatNumber(dayStats[date]?.count ?? 0)})
            </button>
          ))}
        </div>
        <button onClick={() => onSelectDate(addDaysISO(selectedDate, 1))} title="روز بعد" className="p-2 rounded-xl bg-white border border-surface-200 text-surface-500 hover:bg-surface-50 shrink-0">
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="card p-4">
        <SectionHeader
          title={`${selectedDate === today ? 'امروز، ' : ''}${getPersianDayName(selectedDate)} ${formatDateShort(selectedDate)}`}
          note={slots.length > 0 ? `${formatNumber(free)} از ${formatNumber(slots.length)} ساعت خالی` : 'تعطیل'}
          className="mb-3"
        />
        {slots.length === 0 && <p className="text-sm text-surface-400">کلینیک در این روز تعطیل است. ساعات کاری را از تنظیمات تغییر دهید.</p>}
        <div className="flex flex-wrap gap-1.5">
          {slots.map((slot) => {
            const isBooked = booked.has(slot);
            return (
              <button
                key={slot}
                disabled={isBooked}
                onClick={() => onNew(slot)}
                title={isBooked ? 'رزرو شده' : 'خالی - کلیک برای رزرو'}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isBooked ? 'bg-surface-100 border-surface-100 text-surface-400' : 'bg-white border-primary-200 text-primary-700 hover:bg-primary-50'
                }`}
              >
                {formatClock(slot)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-4">
        {loading ? (
          <Skeleton className="h-20" variant="inset" />
        ) : appointments.length === 0 ? (
          <p className="text-center text-surface-400 text-sm py-8">هیچ نوبتی برای این روز وجود ندارد</p>
        ) : (
          <div className="space-y-2">
            {appointments.map((apt) => {
              const status = statusStyle(appointmentStatus, apt.status, 'pending');
              return (
                <div
                  key={apt.id}
                  onClick={() => onOpenPatient(apt.patient_id)}
                  className={`flex gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${status.bg} ${status.text} ${status.border}`}
                >
                  <div className="text-center w-14 shrink-0">
                    <p className="text-sm font-bold">{formatClock(apt.start_time)}</p>
                    <p className="text-xs opacity-70">تا {formatClock(apt.end_time)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{fullName(apt.patient)}</p>
                    <p className="text-xs opacity-80 truncate">
                      {apt.service?.name || 'نوبت عمومی'}
                      {apt.doctor && <> · {apt.doctor.full_name}</>}
                    </p>
                    {planned.has(apt.id) && <span className="text-xs bg-white/60 px-1.5 py-0.5 rounded-sm mt-1 inline-block">طرح درمان</span>}
                  </div>
                  <span className="text-xs font-medium self-center shrink-0">{status.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
