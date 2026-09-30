import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Phone,
  X,
  Calendar,
  Grid3x3,
  List,
  AlertCircle,
  CalendarCheck,
  Dot,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatNumber, formatTime, getPersianDayName, persianDays } from '@/lib/format';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/Toast';
import type { Appointment, Patient, Service, Staff, PageKey } from '@/lib/types';

interface AppointmentsProps {
  onNavigate: (page: PageKey) => void;
  onOpenPatient: (patientId: string) => void;
}

const WORK_HOURS = { start: 9, end: 18 };
const SLOT_INTERVAL = 30;

export function Appointments({ onOpenPatient }: AppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [monthAppointments, setMonthAppointments] = useState<Record<string, { count: number; emptySlots: number }>>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patient_id: '',
    service_id: '',
    staff_id: '',
    start_time: '09:00',
    end_time: '09:30',
    notes: '',
    price: 0,
    status: 'pending' as string,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [apptsRes, patRes, svcRes, stfRes] = await Promise.all([
      supabase.from('appointments').select('*, patient:patients(*), staff:staff(*), service:services(*)').eq('appointment_date', selectedDate).order('start_time'),
      supabase.from('patients').select('*').order('first_name'),
      supabase.from('services').select('*').eq('active', true),
      supabase.from('staff').select('*').eq('active', true),
    ]);
    setAppointments(apptsRes.data || []);
    setPatients(patRes.data || []);
    setServices(svcRes.data || []);
    setStaffList(stfRes.data || []);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => { load(); }, [load]);

  // Load month appointments count for calendar
  useEffect(() => {
    const firstDay = new Date(calendarMonth.year, calendarMonth.month, 1).toISOString().split('T')[0];
    const lastDay = new Date(calendarMonth.year, calendarMonth.month + 1, 0).toISOString().split('T')[0];
    supabase
      .from('appointments')
      .select('appointment_date, start_time, end_time, status')
      .gte('appointment_date', firstDay)
      .lte('appointment_date', lastDay)
      .then(({ data }) => {
        const counts: Record<string, { count: number; emptySlots: number }> = {};
        (data || []).forEach((a: { appointment_date: string; start_time: string; end_time: string; status: string }) => {
          if (!counts[a.appointment_date]) counts[a.appointment_date] = { count: 0, emptySlots: allSlots.length };
          counts[a.appointment_date].count++;
          const start = a.start_time.slice(0, 5);
          const end = a.end_time.slice(0, 5);
          if (a.status !== 'cancelled') {
            allSlots.forEach((slot) => {
              if (slot >= start && slot < end) counts[a.appointment_date].emptySlots--;
            });
          }
        });
        setMonthAppointments(counts);
      });
  }, [calendarMonth]);

  async function createAppointment() {
    if (!form.patient_id || !form.service_id) { showToast('بیمار و خدمت را انتخاب کنید', 'error'); return; }
    const { error } = await supabase.from('appointments').insert({
      patient_id: form.patient_id,
      service_id: form.service_id,
      staff_id: form.staff_id || null,
      appointment_date: selectedDate,
      start_time: form.start_time,
      end_time: form.end_time,
      notes: form.notes || null,
      price: form.price,
      status: form.status,
    });
    if (error) showToast('خطا در ثبت نوبت', 'error');
    else { showToast('نوبت ثبت شد'); setShowForm(false); setForm({ patient_id: '', service_id: '', staff_id: '', start_time: '09:00', end_time: '09:30', notes: '', price: 0, status: 'pending' }); load(); }
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) showToast('خطا در بروزرسانی', 'error');
    else { showToast('وضعیت نوبت بروزرسانی شد'); load(); }
  }

  async function deleteAppointment(id: string) {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) showToast('خطا در حذف', 'error');
    else { showToast('نوبت حذف شد'); load(); }
  }

  function changeDay(delta: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  }

  // Generate all possible time slots
  const allSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = WORK_HOURS.start; h < WORK_HOURS.end; h++) {
      for (let m = 0; m < 60; m += SLOT_INTERVAL) {
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return slots;
  }, []);

  const bookedSlots = useMemo(() => {
    const booked = new Set<string>();
    appointments.forEach((apt) => {
      if (apt.status === 'cancelled') return;
      const start = apt.start_time.slice(0, 5);
      const end = apt.end_time.slice(0, 5);
      allSlots.forEach((slot) => {
        if (slot >= start && slot < end) booked.add(slot);
      });
    });
    return booked;
  }, [appointments, allSlots]);

  const emptySlotsCount = allSlots.length - bookedSlots.size;
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  const statusConfig: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    pending: { label: 'در انتظار', bg: 'bg-warning-50', text: 'text-warning-600', icon: <Clock size={12} /> },
    confirmed: { label: 'تایید شده', bg: 'bg-secondary-50', text: 'text-secondary-600', icon: <CheckCircle2 size={12} /> },
    completed: { label: 'تکمیل شده', bg: 'bg-accent-50', text: 'text-accent-600', icon: <CheckCircle2 size={12} /> },
    cancelled: { label: 'لغو شده', bg: 'bg-error-50', text: 'text-error-600', icon: <XCircle size={12} /> },
    no_show: { label: 'غیبت', bg: 'bg-error-50', text: 'text-error-600', icon: <XCircle size={12} /> },
  };

  const dayName = getPersianDayName(new Date(selectedDate));

  // Calendar grid generation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarMonth.year, calendarMonth.month, 1);
    const lastDay = new Date(calendarMonth.year, calendarMonth.month + 1, 0);
    const startOffset = (firstDay.getDay() + 1) % 7; // Adjust for Saturday start
    const days: (string | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(calendarMonth.year, calendarMonth.month, d).toISOString().split('T')[0]);
    }
    return days;
  }, [calendarMonth]);

  function changeMonth(delta: number) {
    setCalendarMonth((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const monthName = new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(new Date(calendarMonth.year, calendarMonth.month, 1));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-surface-800">نوبت‌دهی</h1>
          <p className="text-sm text-surface-400 mt-1">مدیریت نوبت‌های کلینیک</p>
        </div>
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
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={18} />
            نوبت جدید
          </button>
        </div>
      </div>

      {/* Today's summary + empty slots */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <CalendarDays size={18} className="text-primary-500" />
            </div>
            <div>
              <p className="text-xs text-surface-500">نوبت‌های امروز</p>
              <p className="text-lg font-bold text-surface-800">{formatNumber(appointments.length)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-accent-500" />
            </div>
            <div>
              <p className="text-xs text-surface-500">تکمیل شده</p>
              <p className="text-lg font-bold text-surface-800">{formatNumber(appointments.filter((a) => a.status === 'completed').length)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center">
              <Clock size={18} className="text-warning-500" />
            </div>
            <div>
              <p className="text-xs text-surface-500">در انتظار</p>
              <p className="text-lg font-bold text-surface-800">{formatNumber(appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed').length)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center">
              <AlertCircle size={18} className="text-secondary-500" />
            </div>
            <div>
              <p className="text-xs text-surface-500">ساعات خالی</p>
              <p className="text-lg font-bold text-surface-800">{formatNumber(emptySlotsCount)} <span className="text-xs font-normal text-surface-400">از {formatNumber(allSlots.length)}</span></p>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        /* Calendar View */
        <div className="space-y-4">
          {/* Week strip for quick navigation */}
          <div className="card p-3">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => changeDay(-1)} className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors">
                <ChevronRight size={18} className="text-surface-500" />
              </button>
              <button
                onClick={() => { setSelectedDate(todayStr); setCalendarMonth({ year: new Date().getFullYear(), month: new Date().getMonth() }); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 text-xs font-medium hover:bg-primary-100 transition-colors"
              >
                <CalendarCheck size={14} />
                امروز
              </button>
              <button onClick={() => changeDay(1)} className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors">
                <ChevronLeft size={18} className="text-surface-500" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {[...Array(7)].map((_, idx) => {
                const d = new Date();
                d.setDate(d.getDate() + idx);
                const dateStr = d.toISOString().split('T')[0];
                const dayInfo = monthAppointments[dateStr];
                const isSelected = dateStr === selectedDate;
                const isTodayCell = dateStr === todayStr;
                return (
                  <button
                    key={idx}
                    onClick={() => { setSelectedDate(dateStr); setCalendarMonth({ year: d.getFullYear(), month: d.getMonth() }); }}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-primary-500 text-white'
                        : isTodayCell
                        ? 'bg-primary-50 text-primary-700'
                        : 'hover:bg-surface-50 text-surface-500'
                    }`}
                  >
                    <span className="text-[10px] font-medium">{getPersianDayName(d).slice(0, 2)}</span>
                    <span className="text-sm font-bold">{formatNumber(d.getDate())}</span>
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
              <button onClick={() => changeMonth(-1)} className="p-2 rounded-xl hover:bg-surface-100 transition-colors">
                <ChevronRight size={20} className="text-surface-500" />
              </button>
              <div className="text-center">
                <p className="font-bold text-surface-800">{monthName} {formatNumber(calendarMonth.year)}</p>
                <p className="text-xs text-surface-400 mt-0.5">تقویم نوبت‌ها</p>
              </div>
              <button onClick={() => changeMonth(1)} className="p-2 rounded-xl hover:bg-surface-100 transition-colors">
                <ChevronLeft size={20} className="text-surface-500" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {persianDays.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-surface-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dateStr, i) => {
                if (!dateStr) return <div key={i} />;
                const dayInfo = monthAppointments[dateStr];
                const count = dayInfo?.count || 0;
                const emptyInDay = dayInfo?.emptySlots ?? allSlots.length;
                const isSelected = dateStr === selectedDate;
                const isTodayCell = dateStr === todayStr;
                const isPast = dateStr < todayStr;
                const dayNum = new Date(dateStr).getDate();
                const density = count / allSlots.length;
                const densityColor = density >= 0.7 ? 'bg-error-400' : density >= 0.4 ? 'bg-warning-400' : density > 0 ? 'bg-accent-400' : '';
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-primary-500 text-white shadow-md'
                        : isTodayCell
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : isPast
                        ? 'hover:bg-surface-50 text-surface-300'
                        : 'hover:bg-surface-50 text-surface-600'
                    }`}
                  >
                    <span className={`text-sm font-bold ${isSelected ? 'text-white' : ''}`}>{formatNumber(dayNum)}</span>
                    {count > 0 && (
                      <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-surface-400'}`}>
                        {formatNumber(count)} نوبت
                      </span>
                    )}
                    {count > 0 && !isSelected && (
                      <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${densityColor}`} />
                    )}
                    {count === 0 && !isPast && !isSelected && emptyInDay === allSlots.length && (
                      <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-surface-200" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-surface-100">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-accent-400" />
                <span className="text-[10px] text-surface-400">کم پر</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-warning-400" />
                <span className="text-[10px] text-surface-400">نیمه پر</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-error-400" />
                <span className="text-[10px] text-surface-400">پر</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-surface-200" />
                <span className="text-[10px] text-surface-400">خالی</span>
              </div>
            </div>
          </div>

          {/* Selected date appointments in calendar view */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-surface-800">{dayName}</h3>
                <p className="text-xs text-surface-400 mt-0.5">{formatNumber(new Date(selectedDate).getDate())} {new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(new Date(selectedDate))}</p>
              </div>
              <span className="badge bg-primary-50 text-primary-600">{formatNumber(appointments.length)} نوبت</span>
            </div>
            {loading ? (
              <div className="h-20 bg-surface-50 rounded-xl animate-pulse-soft" />
            ) : appointments.length === 0 ? (
              <p className="text-sm text-surface-400 text-center py-6">هیچ نوبتی برای این روز</p>
            ) : (
              <div className="space-y-2">
                {appointments.map((apt) => {
                  const sc = statusConfig[apt.status] || statusConfig.pending;
                  return (
                    <div key={apt.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-white shrink-0">
                        <span className="font-bold text-surface-700 text-sm">{formatTime(apt.start_time).split(' ')[0]}</span>
                        <span className="text-[10px] text-surface-400">{formatTime(apt.start_time).split(' ')[1]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-surface-800 text-sm truncate">
                          {apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'نامشخص'}
                        </p>
                        <p className="text-xs text-surface-400 truncate">
                          {apt.service?.name || 'نوبت عمومی'}
                        </p>
                      </div>
                      <span className={`badge ${sc.bg} ${sc.text}`}>{sc.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <>
          {/* Date Navigation */}
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <button onClick={() => changeDay(-1)} className="p-2 rounded-xl hover:bg-surface-100 transition-colors">
                <ChevronRight size={20} className="text-surface-500" />
              </button>
              <div className="text-center">
                <p className="font-bold text-surface-800">{dayName}</p>
                <p className="text-xs text-surface-400 mt-0.5">{formatNumber(new Date(selectedDate).getDate())} {new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(new Date(selectedDate))}</p>
              </div>
              <button onClick={() => changeDay(1)} className="p-2 rounded-xl hover:bg-surface-100 transition-colors">
                <ChevronLeft size={20} className="text-surface-500" />
              </button>
            </div>
            {isToday && (
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
                  <span className="font-bold text-secondary-600">{formatNumber(emptySlotsCount)}</span> از {formatNumber(allSlots.length)} ساعت خالی
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allSlots.map((slot) => {
                  const isBooked = bookedSlots.has(slot);
                  return (
                    <div
                      key={slot}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isBooked
                          ? 'bg-primary-100 text-primary-600 cursor-default'
                          : 'bg-secondary-50 text-secondary-600 hover:bg-secondary-100 cursor-pointer'
                      }`}
                      onClick={() => {
                        if (!isBooked) {
                          setForm({ ...form, start_time: slot, end_time: addMinutes(slot, 30) });
                          setShowForm(true);
                        }
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
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-white rounded-2xl border border-surface-100 animate-pulse-soft" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="هیچ نوبتی برای این روز"
              description="برای این تاریخ نوبتی ثبت نشده است"
              action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={18} />نوبت جدید</button>}
            />
          ) : (
            <div className="space-y-3">
              {appointments.map((apt, i) => {
                const sc = statusConfig[apt.status] || statusConfig.pending;
                return (
                  <div
                    key={apt.id}
                    className="card card-hover p-4 animate-slide-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-surface-50 shrink-0">
                        <span className="text-xs text-surface-400">{formatTime(apt.start_time).split(' ')[1]}</span>
                        <span className="font-bold text-surface-700 text-sm">{formatTime(apt.start_time).split(' ')[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => onOpenPatient(apt.patient_id)}
                          className="font-medium text-surface-800 text-sm hover:text-primary-600 transition-colors"
                        >
                          {apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'نامشخص'}
                        </button>
                        <p className="text-xs text-surface-400 mt-0.5">
                          {apt.service?.name || 'نوبت عمومی'} • {apt.staff?.full_name || 'بدون دکتر'}
                        </p>
                        {apt.notes && <p className="text-xs text-surface-500 mt-1">{apt.notes}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`badge ${sc.bg} ${sc.text}`}>{sc.icon}{sc.label}</span>
                          <span className="text-xs text-surface-400">{formatCurrency(apt.price)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        {apt.status === 'pending' && (
                          <button onClick={() => updateStatus(apt.id, 'confirmed')} className="p-1.5 rounded-lg bg-secondary-50 hover:bg-secondary-100" title="تایید">
                            <CheckCircle2 size={16} className="text-secondary-500" />
                          </button>
                        )}
                        {apt.status === 'confirmed' && (
                          <button onClick={() => updateStatus(apt.id, 'completed')} className="p-1.5 rounded-lg bg-accent-50 hover:bg-accent-100" title="تکمیل">
                            <CheckCircle2 size={16} className="text-accent-500" />
                          </button>
                        )}
                        <button onClick={() => updateStatus(apt.id, 'cancelled')} className="p-1.5 rounded-lg bg-error-50 hover:bg-error-100" title="لغو">
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
      )}

      {showForm && (
        <Modal open onClose={() => setShowForm(false)} title="نوبت جدید" size="md">
          <div className="space-y-4">
            <div className="p-3 bg-primary-50 rounded-xl">
              <p className="text-xs text-primary-600 font-medium">{dayName}، {formatNumber(new Date(selectedDate).getDate())} {new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(new Date(selectedDate))}</p>
            </div>
            <div>
              <label className="label-field">بیمار *</label>
              <select className="input-field" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
                <option value="">انتخاب بیمار</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} - {p.phone}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">خدمت *</label>
              <select
                className="input-field"
                value={form.service_id}
                onChange={(e) => {
                  const svc = services.find((s) => s.id === e.target.value);
                  setForm({
                    ...form,
                    service_id: e.target.value,
                    price: svc?.default_price || 0,
                    end_time: addMinutes(form.start_time, svc?.duration_minutes || 30),
                  });
                }}
              >
                <option value="">انتخاب خدمت</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name} - {formatCurrency(s.default_price)}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">دندانپزشک</label>
              <select className="input-field" value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })}>
                <option value="">انتخاب دکتر</option>
                {staffList.filter((s) => s.role === 'dentist').map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">ساعت شروع</label>
                <input type="time" className="input-field" value={form.start_time} onChange={(e) => {
                  const svc = services.find((s) => s.id === form.service_id);
                  setForm({ ...form, start_time: e.target.value, end_time: addMinutes(e.target.value, svc?.duration_minutes || 30) });
                }} />
              </div>
              <div>
                <label className="label-field">ساعت پایان</label>
                <input type="time" className="input-field" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label-field">مبلغ (تومان)</label>
              <input type="number" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="label-field">یادداشت</label>
              <textarea className="input-field min-h-[60px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={createAppointment} className="btn-primary flex-1">ثبت نوبت</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">انصراف</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}
