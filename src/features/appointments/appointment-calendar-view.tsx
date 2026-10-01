import { CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { appointmentStatus, statusStyle } from '@/constants/status';
import {
  addDaysISO,
  currentJalaliMonth,
  formatDateShort,
  formatJalaliMonth,
  getPersianDayName,
  jalaliDay,
  jalaliMonthGrid,
  jalaliMonthOf,
  nextDays,
  persianDays,
  shiftJalaliMonth,
  todayISO,
  type JalaliMonth,
} from '@/lib/date';
import { formatNumber, formatTime, fullName } from '@/lib/format';
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
}

const legend = [
  { color: 'bg-accent-400', label: 'کم پر' },
  { color: 'bg-warning-400', label: 'نیمه پر' },
  { color: 'bg-error-400', label: 'پر' },
  { color: 'bg-surface-200', label: 'خالی' },
];

export function AppointmentCalendarView({ selectedDate, onSelectDate, month, onMonthChange, dayStats, appointments, loading }: AppointmentCalendarViewProps) {
  const today = todayISO();

  function selectDay(date: string) {
    onSelectDate(date);
    onMonthChange(jalaliMonthOf(date));
  }

  return (
    <div className="space-y-4">
      {/* Week strip for quick navigation */}
      <div className="card p-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => selectDay(addDaysISO(selectedDate, -1))} className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors">
            <ChevronRight size={18} className="text-surface-500" />
          </button>
          <button
            onClick={() => { onSelectDate(today); onMonthChange(currentJalaliMonth()); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 text-xs font-medium hover:bg-primary-100 transition-colors"
          >
            <CalendarCheck size={14} />
            امروز
          </button>
          <button onClick={() => selectDay(addDaysISO(selectedDate, 1))} className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors">
            <ChevronLeft size={18} className="text-surface-500" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {nextDays(7).map((date) => {
            const dayInfo = dayStats[date];
            const isSelected = date === selectedDate;
            return (
              <button
                key={date}
                onClick={() => selectDay(date)}
                className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-primary-500 text-white'
                    : date === today
                    ? 'bg-primary-50 text-primary-700'
                    : 'hover:bg-surface-50 text-surface-500'
                }`}
              >
                <span className="text-[10px] font-medium">{getPersianDayName(date).slice(0, 2)}</span>
                <span className="text-sm font-bold">{formatNumber(jalaliDay(date))}</span>
                {dayInfo && dayInfo.emptySlots > 0 && (
                  <span className={`text-[9px] ${isSelected ? 'text-white/70' : 'text-secondary-500'}`}>
                    {formatNumber(dayInfo.emptySlots)} خالی
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Month calendar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => onMonthChange(shiftJalaliMonth(month, -1))} className="p-2 rounded-xl hover:bg-surface-100 transition-colors">
            <ChevronRight size={20} className="text-surface-500" />
          </button>
          <div className="text-center">
            <p className="font-bold text-surface-800">{formatJalaliMonth(month)}</p>
            <p className="text-xs text-surface-400 mt-0.5">تقویم نوبت‌ها</p>
          </div>
          <button onClick={() => onMonthChange(shiftJalaliMonth(month, 1))} className="p-2 rounded-xl hover:bg-surface-100 transition-colors">
            <ChevronLeft size={20} className="text-surface-500" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {persianDays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-surface-400 py-2">
              {day}
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
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-primary-500 text-white shadow-md'
                    : date === today
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : isPast
                    ? 'hover:bg-surface-50 text-surface-300'
                    : 'hover:bg-surface-50 text-surface-600'
                }`}
              >
                <span className={`text-sm font-bold ${isSelected ? 'text-white' : ''}`}>{formatNumber(jalaliDay(date))}</span>
                {count > 0 && (
                  <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-surface-400'}`}>
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
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-surface-800">{getPersianDayName(selectedDate)}</h3>
            <p className="text-xs text-surface-400 mt-0.5">{formatDateShort(selectedDate)}</p>
          </div>
          <span className="badge bg-primary-50 text-primary-600">{formatNumber(appointments.length)} نوبت</span>
        </div>
        {loading ? (
          <Skeleton className="h-20" variant="inset" />
        ) : appointments.length === 0 ? (
          <p className="text-sm text-surface-400 text-center py-6">هیچ نوبتی برای این روز</p>
        ) : (
          <div className="space-y-2">
            {appointments.map((apt) => {
              const [clock, period] = formatTime(apt.start_time).split(' ');
              return (
                <div key={apt.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-white shrink-0">
                    <span className="font-bold text-surface-700 text-sm">{clock}</span>
                    <span className="text-[10px] text-surface-400">{period}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-800 text-sm truncate">{fullName(apt.patient)}</p>
                    <p className="text-xs text-surface-400 truncate">
                      {apt.service?.name || 'نوبت عمومی'}
                    </p>
                  </div>
                  <StatusBadge status={statusStyle(appointmentStatus, apt.status, 'pending')} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
