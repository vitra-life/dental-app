import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Users,
  DollarSign,
  CalendarDays,
  Send,
  Lightbulb,
  Target,
  Clock,
  ArrowRight,
  Search,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatNumber, formatTime, formatDate, getPersianDayName } from '@/lib/format';
import type { Patient, Appointment, Invoice, PageKey } from '@/lib/types';

interface AIAssistantProps {
  onNavigate: (page: PageKey) => void;
  onOpenPatient: (patientId: string) => void;
}

interface Insight {
  id: string;
  type: 'revenue' | 'patients' | 'opportunity' | 'alert' | 'segment';
  title: string;
  description: string;
  action?: { label: string; page?: PageKey; patientId?: string };
  value?: string;
  icon: React.ReactNode;
  color: string;
}

const WORK_HOURS = { start: 9, end: 18 };
const SLOT_INTERVAL = 30;

export function AIAssistant({ onNavigate, onOpenPatient }: AIAssistantProps) {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [segments, setSegments] = useState<{ label: string; count: number; color: string; patients: Patient[] }[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<{ date: string; time: string; dayName: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [patRes, aptRes, invRes] = await Promise.all([
      supabase.from('patients').select('*'),
      supabase.from('appointments').select('*, patient:patients(*)'),
      supabase.from('invoices').select('*, patient:patients(*)'),
    ]);

    const patients = patRes.data || [];
    const appointments = aptRes.data || [];
    const invoices = invRes.data || [];

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    const insightList: Insight[] = [];

    const thisMonthInv = invoices.filter((i) => {
      const d = new Date(i.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonthInv = invoices.filter((i) => {
      const d = new Date(i.created_at);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    });
    const thisMonthRev = thisMonthInv.reduce((s, i) => s + (i.total || 0), 0);
    const lastMonthRev = lastMonthInv.reduce((s, i) => s + (i.total || 0), 0);
    const revChange = lastMonthRev > 0 ? Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100) : 0;

    if (revChange < 0) {
      insightList.push({
        id: 'rev-decline',
        type: 'revenue',
        title: 'کاهش درآمد این ماه',
        description: `درآمد این ماه ${formatNumber(Math.abs(revChange))}٪ کمتر از ماه قبل است. درآمد فعلی: ${formatCurrency(thisMonthRev)}`,
        value: `${revChange}%`,
        icon: <TrendingUp size={18} />,
        color: 'error',
      });
    } else if (revChange > 0) {
      insightList.push({
        id: 'rev-growth',
        type: 'revenue',
        title: 'رشد درآمد',
        description: `درآمد این ماه ${formatNumber(revChange)}٪ بیشتر از ماه قبل است. درآمد فعلی: ${formatCurrency(thisMonthRev)}`,
        value: `+${revChange}%`,
        icon: <TrendingUp size={18} />,
        color: 'accent',
      });
    }

    const debtors = patients.filter((p) => p.balance > 0);
    if (debtors.length > 0) {
      const totalDebt = debtors.reduce((s, p) => s + p.balance, 0);
      insightList.push({
        id: 'pending-payments',
        type: 'alert',
        title: 'بیماران بدهکار',
        description: `${formatNumber(debtors.length)} بیمار مجموعاً ${formatCurrency(totalDebt)} بدهی دارند. پیگیری پرداخت‌ها می‌تواند جریان نقدی را بهبود بخشد.`,
        action: { label: 'مشاهده صورتحساب‌ها', page: 'billing' },
        value: formatCurrency(totalDebt),
        icon: <AlertTriangle size={18} />,
        color: 'warning',
      });
    }

    const inactivePatients = patients.filter((p) => {
      const lastApt = appointments.filter((a) => a.patient_id === p.id).sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))[0];
      return !lastApt || new Date(lastApt.appointment_date) < sixMonthsAgo;
    });
    if (inactivePatients.length > 0) {
      insightList.push({
        id: 'inactive-patients',
        type: 'opportunity',
        title: 'بیماران غیرفعال',
        description: `${formatNumber(inactivePatients.length)} بیمار بیش از ۶ ماه مراجعه نکرده‌اند. ارسال پیام پیگیری می‌تواند بازگشت آن‌ها را افزایش دهد.`,
        action: { label: 'مشاهده بیماران', page: 'patients' },
        value: formatNumber(inactivePatients.length),
        icon: <Users size={18} />,
        color: 'secondary',
      });
    }

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const tomorrowAppts = appointments.filter((a) => a.appointment_date === tomorrowStr);
    const tomorrowRevenue = tomorrowAppts.filter((a) => a.status === 'completed' || a.status === 'confirmed').reduce((s, a) => s + (a.price || 0), 0);
    insightList.push({
      id: 'tomorrow-opportunity',
      type: 'opportunity',
      title: 'فرصت‌های فردا',
      description: `فردا ${formatNumber(tomorrowAppts.length)} نوبت برنامه‌ریزی شده با ارزش تقریبی ${formatCurrency(tomorrowRevenue)}.`,
      action: { label: 'مشاهده نوبت‌ها', page: 'appointments' },
      value: formatCurrency(tomorrowRevenue),
      icon: <CalendarDays size={18} />,
      color: 'primary',
    });

    const inProgress = appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed');
    if (inProgress.length > 0) {
      insightList.push({
        id: 'unfinished',
        type: 'alert',
        title: 'درمان‌های ناتمام',
        description: `${formatNumber(inProgress.length)} نوبت در انتظار یا تایید شده دارند که هنوز تکمیل نشده‌اند.`,
        action: { label: 'مدیریت نوبت‌ها', page: 'appointments' },
        value: formatNumber(inProgress.length),
        icon: <Clock size={18} />,
        color: 'warning',
      });
    }

    setInsights(insightList);

    const segList: { label: string; count: number; color: string; patients: Patient[] }[] = [];

    const inactive = patients.filter((p) => {
      const lastApt = appointments.filter((a) => a.patient_id === p.id).sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))[0];
      return !lastApt || new Date(lastApt.appointment_date) < sixMonthsAgo;
    });
    segList.push({ label: 'غیرفعال (۶ ماه+)', count: inactive.length, color: '#f59e0b', patients: inactive });

    const veryInactive = patients.filter((p) => {
      const lastApt = appointments.filter((a) => a.patient_id === p.id).sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))[0];
      return !lastApt || new Date(lastApt.appointment_date) < oneYearAgo;
    });
    segList.push({ label: 'غیبت بیش از ۱ سال', count: veryInactive.length, color: '#ef4444', patients: veryInactive });

    const debtorsSeg = patients.filter((p) => p.balance > 0);
    segList.push({ label: 'بدهکار', count: debtorsSeg.length, color: '#dc2626', patients: debtorsSeg });

    const hasInsurance = patients.filter((p) => p.insurance_company);
    segList.push({ label: 'دارای بیمه', count: hasInsurance.length, color: '#3b82f6', patients: hasInsurance });

    const hasAllergy = patients.filter((p) => p.allergies);
    segList.push({ label: 'دارای آلرژی', count: hasAllergy.length, color: '#8b5cf6', patients: hasAllergy });

    const active = patients.filter((p) => {
      const lastApt = appointments.filter((a) => a.patient_id === p.id).sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))[0];
      return lastApt && new Date(lastApt.appointment_date) >= sixMonthsAgo;
    });
    segList.push({ label: 'بیماران فعال', count: active.length, color: '#22c55e', patients: active });

    setSegments(segList);

    // Find available slots for next 7 days
    const slots: { date: string; time: string; dayName: string }[] = [];
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const d = new Date(now);
      d.setDate(d.getDate() + dayOffset);
      const dateStr = d.toISOString().split('T')[0];
      const dayAppts = appointments.filter((a) => a.appointment_date === dateStr && a.status !== 'cancelled');
      const bookedTimes = new Set<string>();
      dayAppts.forEach((apt) => {
        const start = apt.start_time.slice(0, 5);
        const end = apt.end_time.slice(0, 5);
        for (let h = WORK_HOURS.start; h < WORK_HOURS.end; h++) {
          for (let m = 0; m < 60; m += SLOT_INTERVAL) {
            const slot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            if (slot >= start && slot < end) bookedTimes.add(slot);
          }
        }
      });
      for (let h = WORK_HOURS.start; h < WORK_HOURS.end; h++) {
        for (let m = 0; m < 60; m += SLOT_INTERVAL) {
          const slot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          if (!bookedTimes.has(slot) && slots.length < 10) {
            slots.push({ date: dateStr, time: slot, dayName: getPersianDayName(d) });
          }
        }
      }
      if (slots.length >= 10) break;
    }
    setAvailableSlots(slots);

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function findFirstAvailableSlot(): Promise<string> {
    const now = new Date();
    const allAppts = (await supabase.from('appointments').select('appointment_date, start_time, end_time, status')).data || [];

    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const d = new Date(now);
      d.setDate(d.getDate() + dayOffset);
      const dateStr = d.toISOString().split('T')[0];
      const dayAppts = allAppts.filter((a) => a.appointment_date === dateStr && a.status !== 'cancelled');
      const bookedTimes = new Set<string>();
      dayAppts.forEach((apt) => {
        const start = apt.start_time.slice(0, 5);
        const end = apt.end_time.slice(0, 5);
        for (let h = WORK_HOURS.start; h < WORK_HOURS.end; h++) {
          for (let m = 0; m < 60; m += SLOT_INTERVAL) {
            const slot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            if (slot >= start && slot < end) bookedTimes.add(slot);
          }
        }
      });
      for (let h = WORK_HOURS.start; h < WORK_HOURS.end; h++) {
        for (let m = 0; m < 60; m += SLOT_INTERVAL) {
          const slot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          if (!bookedTimes.has(slot)) {
            const dayName = getPersianDayName(d);
            const dayNum = d.getDate();
            const monthName = new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(d);
            return `نزدیک‌ترین نوبت خالی:\n\n${dayName}، ${formatNumber(dayNum)} ${monthName}\nساعت ${formatTime(slot)}\n\nبرای رزرو این نوبت به بخش نوبت‌دهی مراجعه کنید.`;
          }
        }
      }
    }
    return 'در ۱۴ روز آینده هیچ نوبت خالی یافت نشد.';
  }

  function handleAsk() {
    if (!question.trim()) return;
    setAsking(true);
    setAnswer(null);

    const q = question.trim();
    let response = '';

    if (q.includes('نوبت') && (q.includes('خالی') || q.includes('اول') || q.includes('باز') || q.includes('آزاد'))) {
      setAsking(true);
      findFirstAvailableSlot().then((result) => {
        setAnswer(result);
        setAsking(false);
      });
      return;
    }

    if (q.includes('درآمد') || q.includes('پول') || q.includes('مالی')) {
      const totalRev = insights.find((i) => i.type === 'revenue');
      const debt = insights.find((i) => i.id === 'pending-payments');
      response = `بر اساس داده‌های فعلی:\n\n`;
      if (totalRev) response += `• ${totalRev.description}\n`;
      if (debt) response += `• ${debt.description}\n`;
      response += `\nپیشنهاد: پیگیری مطالبات معوق و تماس با بیماران غیرفعال می‌تواند درآمد را افزایش دهد.`;
    } else if (q.includes('بیمار') && (q.includes('غیرفعال') || q.includes('برنگشت') || q.includes('برگشت'))) {
      const inactive = segments.find((s) => s.label.includes('غیرفعال'));
      response = inactive
        ? `${formatNumber(inactive.count)} بیمار بیش از ۶ ماه مراجعه نکرده‌اند.\n\nپیشنهاد: ارسال پیام پیگیری به این بیماران با پیشنهاد چکاپ رایگان یا تخفیف ویژه.`
        : 'هیچ بیمار غیرفعالی یافت نشد.';
    } else if (q.includes('فردا') || q.includes('آینده')) {
      const tomorrow = insights.find((i) => i.id === 'tomorrow-opportunity');
      response = tomorrow ? tomorrow.description : 'برای فردا هیچ نوبتی برنامه‌ریزی نشده است.';
    } else if (q.includes('بده') || q.includes('بدهی') || q.includes('قسط')) {
      const debt = insights.find((i) => i.id === 'pending-payments');
      response = debt ? debt.description : 'هیچ بدهی معوقی وجود ندارد.';
    } else if (q.includes('درمان') && q.includes('شروع') || q.includes('ناتمام')) {
      const unfinished = insights.find((i) => i.id === 'unfinished');
      response = unfinished ? unfinished.description : 'همه درمان‌ها تکمیل شده‌اند.';
    } else if (q.includes('چند بیمار') || q.includes('تعداد بیمار')) {
      const activeSeg = segments.find((s) => s.label.includes('فعال'));
      const inactiveSeg = segments.find((s) => s.label.includes('غیرفعال'));
      response = `بیماران فعال: ${activeSeg ? formatNumber(activeSeg.count) : '۰'}\nبیماران غیرفعال: ${inactiveSeg ? formatNumber(inactiveSeg.count) : '۰'}\n\nپیشنهاد: تمرکز روی بیماران غیرفعال می‌تواند درآمد را افزایش دهد.`;
    } else if (q.includes('بهترین') || q.includes('پیشنهاد') || q.includes('توصیه')) {
      const top = insights.slice(0, 3);
      response = `برترین پیشنهادها:\n\n${top.map((i, idx) => `${idx + 1}. ${i.title}: ${i.description}`).join('\n\n')}`;
    } else {
      response = `من می‌توانم در مورد موارد زیر کمک کنم:\n\n• اولین نوبت خالی کی است؟\n• وضعیت درآمد و مالی\n• بیماران غیرفعال و فرصت‌های بازگشت\n• نوبت‌های فردا\n• بدهی‌ها و مطالبات\n• درمان‌های ناتمام\n• تعداد بیماران\n• بهترین پیشنهادها\n\nسوال خود را دقیق‌تر بپرسید.`;
    }

    setTimeout(() => {
      setAnswer(response);
      setAsking(false);
    }, 600);
  }

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    primary: { bg: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-200' },
    secondary: { bg: 'bg-secondary-50', text: 'text-secondary-600', border: 'border-secondary-200' },
    accent: { bg: 'bg-accent-50', text: 'text-accent-600', border: 'border-accent-200' },
    warning: { bg: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-200' },
    error: { bg: 'bg-error-50', text: 'text-error-600', border: 'border-error-200' },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-white rounded-2xl border border-surface-100 animate-pulse-soft" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl border border-surface-100 animate-pulse-soft" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-l from-primary-600 via-secondary-500 to-primary-500 rounded-2xl p-6 lg:p-8 shadow-elevated">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-32 -translate-y-32 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={18} className="text-white/80" />
            <span className="text-white/80 text-sm font-medium">دستیار هوشمند</span>
          </div>
          <h2 className="text-white text-xl lg:text-2xl font-bold mb-2">تحلیل و پیشنهادهای هوشمند</h2>
          <p className="text-white/70 text-sm mb-4">سوال خود را از من بپرسید تا وضعیت کلینیک را تحلیل کنم</p>
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl p-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="مثلا: اولین نوبت خالی کی است؟ یا درآمدم چطور است؟"
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/50 px-2"
            />
            <button onClick={handleAsk} disabled={asking} className="p-2.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
              <Send size={18} className="text-white" />
            </button>
          </div>

          {/* Quick question chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {['اولین نوبت خالی؟', 'درآمدم چطور است؟', 'چند بیمار غیرفعال دارم؟', 'بهترین پیشنهاد شما؟'].map((chip) => (
              <button
                key={chip}
                onClick={() => { setQuestion(chip); }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 text-xs rounded-lg transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {answer && (
            <div className="mt-4 p-4 bg-white/15 backdrop-blur-sm rounded-xl animate-slide-up">
              <div className="flex items-start gap-2">
                <Lightbulb size={18} className="text-white/80 shrink-0 mt-0.5" />
                <p className="text-white/90 text-sm whitespace-pre-line">{answer}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* First Available Slot - Quick Action */}
      {availableSlots.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Zap size={20} className="text-primary-500" />
              </div>
              <div>
                <h3 className="font-bold text-surface-800">نزدیک‌ترین نوبت‌های خالی</h3>
                <p className="text-xs text-surface-400 mt-0.5">۱۰ نوبت خالی بعدی</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('appointments')}
              className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              نوبت‌دهی
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {availableSlots.map((slot, i) => (
              <button
                key={i}
                onClick={() => onNavigate('appointments')}
                className="p-3 bg-surface-50 hover:bg-primary-50 rounded-xl text-center transition-all group animate-slide-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <p className="text-xs text-surface-400 group-hover:text-primary-500">{slot.dayName}</p>
                <p className="font-bold text-surface-700 text-sm mt-1 group-hover:text-primary-700">{formatTime(slot.time)}</p>
                <p className="text-[10px] text-surface-400 mt-0.5">{formatNumber(new Date(slot.date).getDate())} {new Intl.DateTimeFormat('fa-IR', { month: 'short' }).format(new Date(slot.date))}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Smart Insights */}
      <div>
        <h3 className="font-bold text-surface-800 text-lg mb-4 flex items-center gap-2">
          <Target size={20} className="text-primary-500" />
          پیشنهادهای هوشمند
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.map((insight, i) => {
            const c = colorMap[insight.color] || colorMap.primary;
            return (
              <div
                key={insight.id}
                className={`p-5 rounded-2xl border ${c.bg} ${c.border} animate-slide-up`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 ${c.text}`}>
                    {insight.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-surface-800 text-sm">{insight.title}</h4>
                      {insight.value && <span className={`text-xs font-bold ${c.text} whitespace-nowrap`}>{insight.value}</span>}
                    </div>
                    <p className="text-xs text-surface-600 mt-1 leading-relaxed">{insight.description}</p>
                    {insight.action && (
                      <button
                        onClick={() => {
                          if (insight.action?.patientId) onOpenPatient(insight.action.patientId);
                          else if (insight.action?.page) onNavigate(insight.action.page);
                        }}
                        className={`inline-flex items-center gap-1 mt-3 text-xs font-medium ${c.text} hover:opacity-70 transition-opacity`}
                      >
                        {insight.action.label}
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Patient Segmentation */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-surface-800">سگمنت‌سازی بیماران</h3>
            <p className="text-xs text-surface-400 mt-0.5">دسته‌بندی هوشمند بیماران بر اساس رفتار</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center">
            <Users className="text-secondary-500" size={20} />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {segments.map((seg, i) => (
            <button
              key={i}
              onClick={() => onNavigate('patients')}
              className="p-4 bg-surface-50 hover:bg-surface-100 rounded-xl text-right transition-all animate-slide-up group"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-surface-500 truncate">{seg.label}</p>
                  <p className="text-lg font-bold text-surface-800">{formatNumber(seg.count)} نفر</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
