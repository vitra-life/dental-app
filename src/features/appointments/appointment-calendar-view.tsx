import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { appointmentStatus, statusStyle } from '@/constants/status';
import {
  formatDateShort,
  formatJalaliMonth,
  getPersianDayName,
  jalaliDay,
  jalaliMonthGrid,
  jalaliMonthOf,
  persianDays,
  shiftJalaliMonth,
  todayISO,
  type JalaliMonth,
} from '@/lib/date';
import { formatNumber, formatClock, fullName } from '@/lib/format';
import { ALL_SLOTS } from '@/lib/schedule';
import type { Appointment } from '@/lib/types';

/** Per-day booking summary used for the calendar badges. */
export type DayStats = Record<string, { count: number; emptySlots: number }>;

interface AppointmentCalendarViewProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  month: JalaliMonth;
  onMonthChange: (month: JalaliMonth) => void;
  dayStats: DayStats;
  /** The selected day's appointments. */
  appointments: Appointment[];
  loading: boolean;
  onOpenPatient: (patientId: string) => void;
}

const legend = [
  { color: 'bg-accent-400', label: 'کم پر' },
  { color: 'bg-warning-400', label: 'نیمه پر' },
  { color: 'bg-error-400', label: 'پر' },
  { color: 'bg-surface-200', label: 'خالی' },
];

export function AppointmentCalendarView({ selectedDate, onSelectDate, month, onMonthChange, dayStats, appointments, loading, onOpenPatient }: AppointmentCalendarViewProps) {
  const today = todayISO();

  function selectDay(date: string) {
    onSelectDate(date);
    onMonthChange(jalaliMonthOf(date));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
      {/* Month calendar */}
      <div className="card p-5 lg:col-span-3">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => onMonthChange(shiftJalaliMonth(month, -1))} className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors">
            <ChevronRight size={18} className="text-surface-500" />
          </button>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-surface-800">{formatJalaliMonth(month)}</p>
            <button onClick={() => selectDay(today)} className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-lg hover:bg-primary-100">امروز</button>
          </div>
          <button onClick={() => onMonthChange(shiftJalaliMonth(month, 1))} className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors">
            <ChevronLeft size={18} className="text-surface-500" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {persianDays.map((day) => (
            <div key={day} className="text-center text-[11px] font-medium text-surface-400 py-2 truncate">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {jalaliMonthGrid(month).map((date, i) => {
            if (!date) return <div key={i} />;
            const dayInfo = dayStats[date];
            const count = dayInfo?.count || 0;
            const emptyInDay = dayInfo?.emptySlots ?? ALL_SLOTS.length;
            const isSelected = date === selectedDate;
            const isPast = date < today;
            const density = count / ALL_SLOTS.length;
            const densityColor = density >= 0.7 ? 'bg-error-400' : density >= 0.4 ? 'bg-warning-400' : density > 0 ? 'bg-accent-400' : '';
            return (
              <button
                key={i}
                onClick={() => onSelectDate(date)}
                className={`relative aspect-4/3 rounded-xl flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-primary-600 text-white'
                    : date === today
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : isPast
                    ? 'hover:bg-surface-50 text-surface-300'
                    : 'hover:bg-surface-50 text-surface-600'
                }`}
              >
                <span className={`text-sm font-bold ${isSelected ? 'text-white' : ''}`}>{formatNumber(jalaliDay(date))}</span>
                {count > 0 && (
                  <span className={`hidden sm:block text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-surface-400'}`}>
                    {formatNumber(count)} نوبت
                  </span>
                )}
                {count > 0 && !isSelected && (
                  <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${densityColor}`} />
                )}
                {count === 0 && !isPast && !isSelected && emptyInDay === ALL_SLOTS.length && (
                  <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-surface-200" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-surface-100">
          {legend.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-[10px] text-surface-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected date appointments */}
      <div className="card p-5 lg:col-span-2">
        <SectionHeader title={`${getPersianDayName(selectedDate)} ${formatDateShort(selectedDate)}`} note={`${formatNumber(appointments.length)} نوبت`} />
        {loading ? (
          <Skeleton className="h-20" variant="inset" />
        ) : appointments.length === 0 ? (
          <p className="text-sm text-surface-400 text-center py-6">هیچ نوبتی برای این روز وجود ندارد</p>
        ) : (
          <div className="space-y-2">
            {appointments.map((apt) => (
              <div key={apt.id} onClick={() => onOpenPatient(apt.patient_id)} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors cursor-pointer">
                <span className="text-sm font-bold text-surface-700 w-12 shrink-0 text-center">{formatClock(apt.start_time)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{fullName(apt.patient)}</p>
                  <p className="text-xs text-surface-500 truncate">{apt.service?.name || 'نوبت عمومی'}</p>
                </div>
                <StatusBadge status={statusStyle(appointmentStatus, apt.status, 'pending')} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
