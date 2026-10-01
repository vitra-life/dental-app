import { AlertCircle, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Plus, XCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { appointmentStatus, statusStyle } from '@/constants/status';
import { addDaysISO, formatDateShort, getPersianDayName, todayISO } from '@/lib/date';
import { formatCurrency, formatNumber, formatTime, fullName } from '@/lib/format';
import { ALL_SLOTS } from '@/lib/schedule';
import type { Appointment } from '@/lib/types';

interface AppointmentListViewProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  /** The selected day's appointments. */
  appointments: Appointment[];
  /** Slots already taken on the selected day. */
  booked: Set<string>;
  loading: boolean;
  /** Opens the booking form, optionally with a start time prefilled. */
  onNew: (startTime?: string) => void;
  onStatusChange: (id: string, status: Appointment['status']) => void;
  onOpenPatient: (patientId: string) => void;
}

export function AppointmentListView({ selectedDate, onSelectDate, appointments, booked, loading, onNew, onStatusChange, onOpenPatient }: AppointmentListViewProps) {
  return (
    <>
      {/* Date Navigation */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <button onClick={() => onSelectDate(addDaysISO(selectedDate, -1))} className="p-2 rounded-xl hover:bg-surface-100 transition-colors">
            <ChevronRight size={20} className="text-surface-500" />
          </button>
          <div className="text-center">
            <p className="font-bold text-surface-800">{getPersianDayName(selectedDate)}</p>
            <p className="text-xs text-surface-400 mt-0.5">{formatDateShort(selectedDate)}</p>
          </div>
          <button onClick={() => onSelectDate(addDaysISO(selectedDate, 1))} className="p-2 rounded-xl hover:bg-surface-100 transition-colors">
            <ChevronLeft size={20} className="text-surface-500" />
          </button>
        </div>
        {selectedDate === todayISO() && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-xs text-primary-600 font-medium">امروز</span>
          </div>
        )}
      </div>

      {/* Empty slots bar */}
      {!loading && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-secondary-500" />
              <span className="text-sm font-medium text-surface-700">ساعات خالی</span>
            </div>
            <span className="text-sm text-surface-500">
              <span className="font-bold text-secondary-600">{formatNumber(ALL_SLOTS.length - booked.size)}</span> از {formatNumber(ALL_SLOTS.length)} ساعت خالی
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_SLOTS.map((slot) => {
              const isBooked = booked.has(slot);
              return (
                <div
                  key={slot}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isBooked
                      ? 'bg-primary-100 text-primary-600 cursor-default'
                      : 'bg-secondary-50 text-secondary-600 hover:bg-secondary-100 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!isBooked) onNew(slot);
                  }}
                  title={isBooked ? 'رزرو شده' : 'خالی - کلیک برای رزرو'}
                >
                  {formatTime(slot)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Appointments List */}
      {loading ? (
        <div className="space-y-3">
          <SkeletonList count={4} className="h-20" />
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="هیچ نوبتی برای این روز"
          description="برای این تاریخ نوبتی ثبت نشده است"
          action={<button onClick={() => onNew()} className="btn-primary"><Plus size={18} />نوبت جدید</button>}
        />
      ) : (
        <div className="space-y-3">
          {appointments.map((apt, i) => {
            const [clock, period] = formatTime(apt.start_time).split(' ');
            return (
              <div
                key={apt.id}
                className="card card-hover p-4 animate-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-surface-50 shrink-0">
                    <span className="text-xs text-surface-400">{period}</span>
                    <span className="font-bold text-surface-700 text-sm">{clock}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => onOpenPatient(apt.patient_id)}
                      className="font-medium text-surface-800 text-sm hover:text-primary-600 transition-colors"
                    >
                      {fullName(apt.patient)}
                    </button>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {apt.service?.name || 'نوبت عمومی'} • {apt.staff?.full_name || 'بدون دکتر'}
                    </p>
                    {apt.notes && <p className="text-xs text-surface-500 mt-1">{apt.notes}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge status={statusStyle(appointmentStatus, apt.status, 'pending')} showIcon />
                      <span className="text-xs text-surface-400">{formatCurrency(apt.price)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {apt.status === 'pending' && (
                      <button onClick={() => onStatusChange(apt.id, 'confirmed')} className="p-1.5 rounded-lg bg-secondary-50 hover:bg-secondary-100" title="تایید">
                        <CheckCircle2 size={16} className="text-secondary-500" />
                      </button>
                    )}
                    {apt.status === 'confirmed' && (
                      <button onClick={() => onStatusChange(apt.id, 'completed')} className="p-1.5 rounded-lg bg-accent-50 hover:bg-accent-100" title="تکمیل">
                        <CheckCircle2 size={16} className="text-accent-500" />
                      </button>
                    )}
                    <button onClick={() => onStatusChange(apt.id, 'cancelled')} className="p-1.5 rounded-lg bg-error-50 hover:bg-error-100" title="لغو">
                      <XCircle size={16} className="text-error-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
