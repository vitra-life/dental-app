import { AlertTriangle, CalendarDays, Clock, TrendingUp, Users, type LucideIcon } from 'lucide-react';
import { daysFromToday, formatDateShort, monthsBeforeToday, todayISO } from '@/lib/date';
import { formatCurrency, formatNumber, formatTime } from '@/lib/format';
import { monthOverMonth } from '@/lib/revenue';
import { findFreeSlots, type FreeSlot } from '@/lib/schedule';
import * as db from '@/lib/store';
import type { PageKey, Patient } from '@/lib/types';

/**
 * The "AI assistant" calls no language model. It derives insights from the
 * store's data and answers questions by matching Persian keywords.
 */

export interface Insight {
  id: string;
  type: 'revenue' | 'opportunity' | 'alert';
  title: string;
  description: string;
  action?: { label: string; page: PageKey };
  value?: string;
  icon: LucideIcon;
  color: 'primary' | 'secondary' | 'accent' | 'warning' | 'error';
}

export interface Segment {
  label: string;
  count: number;
  color: string;
}

const ACTIVE_SEGMENT = 'بیماران فعال';

export interface AssistantData {
  insights: Insight[];
  segments: Segment[];
  /** The next free appointment slots. */
  freeSlots: FreeSlot[];
  /** The figures shown above the conversation. */
  summary: { todayAppointments: number; activePlans: number; pendingAmount: number; openLabOrders: number };
}

export function loadAssistantData(): AssistantData {
  const patients = db.list('patients');
  const appointments = db.list('appointments');
  const invoices = db.list('invoices');

  // Latest appointment date per patient.
  const lastVisit = new Map<string, string>();
  for (const apt of appointments) {
    const known = lastVisit.get(apt.patient_id);
    if (!known || apt.appointment_date > known) lastVisit.set(apt.patient_id, apt.appointment_date);
  }
  const notSeenSince = (cutoff: string) => (p: Patient) => (lastVisit.get(p.id) ?? '') < cutoff;
  const sixMonthsAgo = monthsBeforeToday(6);
  const inactive = patients.filter(notSeenSince(sixMonthsAgo));
  const debtors = patients.filter((p) => p.balance > 0);

  const insights: Insight[] = [];

  const revenue = monthOverMonth(invoices);
  if (revenue.change < 0) {
    insights.push({
      id: 'rev-decline',
      type: 'revenue',
      title: 'کاهش درآمد این ماه',
      description: `درآمد این ماه ${formatNumber(Math.abs(revenue.change))}٪ کمتر از ماه قبل است. درآمد فعلی: ${formatCurrency(revenue.thisMonth)}`,
      value: `${formatNumber(revenue.change)}%`,
      icon: TrendingUp,
      color: 'error',
    });
  } else if (revenue.change > 0) {
    insights.push({
      id: 'rev-growth',
      type: 'revenue',
      title: 'رشد درآمد',
      description: `درآمد این ماه ${formatNumber(revenue.change)}٪ بیشتر از ماه قبل است. درآمد فعلی: ${formatCurrency(revenue.thisMonth)}`,
      value: `+${formatNumber(revenue.change)}%`,
      icon: TrendingUp,
      color: 'accent',
    });
  }

  if (debtors.length > 0) {
    const totalDebt = debtors.reduce((s, p) => s + p.balance, 0);
    insights.push({
      id: 'pending-payments',
      type: 'alert',
      title: 'بیماران بدهکار',
      description: `${formatNumber(debtors.length)} بیمار مجموعاً ${formatCurrency(totalDebt)} بدهی دارند. پیگیری پرداخت‌ها می‌تواند جریان نقدی را بهبود بخشد.`,
      action: { label: 'مشاهده صورتحساب‌ها', page: 'billing' },
      value: formatCurrency(totalDebt),
      icon: AlertTriangle,
      color: 'warning',
    });
  }

  if (inactive.length > 0) {
    insights.push({
      id: 'inactive-patients',
      type: 'opportunity',
      title: 'بیماران غیرفعال',
      description: `${formatNumber(inactive.length)} بیمار بیش از ۶ ماه مراجعه نکرده‌اند. ارسال پیام پیگیری می‌تواند بازگشت آن‌ها را افزایش دهد.`,
      action: { label: 'مشاهده بیماران', page: 'patients' },
      value: formatNumber(inactive.length),
      icon: Users,
      color: 'secondary',
    });
  }

  const tomorrow = daysFromToday(1);
  const tomorrowAppts = appointments.filter((a) => a.appointment_date === tomorrow);
  const tomorrowRevenue = tomorrowAppts
    .filter((a) => a.status === 'completed' || a.status === 'confirmed')
    .reduce((s, a) => s + (a.price || 0), 0);
  insights.push({
    id: 'tomorrow-opportunity',
    type: 'opportunity',
    title: 'فرصت‌های فردا',
    description: `فردا ${formatNumber(tomorrowAppts.length)} نوبت برنامه‌ریزی شده با ارزش تقریبی ${formatCurrency(tomorrowRevenue)}.`,
    action: { label: 'مشاهده نوبت‌ها', page: 'appointments' },
    value: formatCurrency(tomorrowRevenue),
    icon: CalendarDays,
    color: 'primary',
  });

  const open = appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed');
  if (open.length > 0) {
    insights.push({
      id: 'unfinished',
      type: 'alert',
      title: 'درمان‌های ناتمام',
      description: `${formatNumber(open.length)} نوبت در انتظار یا تایید شده دارند که هنوز تکمیل نشده‌اند.`,
      action: { label: 'مدیریت نوبت‌ها', page: 'appointments' },
      value: formatNumber(open.length),
      icon: Clock,
      color: 'warning',
    });
  }

  const segments: Segment[] = [
    { label: 'غیرفعال (۶ ماه+)', count: inactive.length, color: '#f59e0b' },
    { label: 'غیبت بیش از ۱ سال', count: patients.filter(notSeenSince(monthsBeforeToday(12))).length, color: '#ef4444' },
    { label: 'بدهکار', count: debtors.length, color: '#dc2626' },
    { label: 'دارای بیمه', count: patients.filter((p) => p.insurance_company).length, color: '#3b82f6' },
    { label: 'دارای آلرژی', count: patients.filter((p) => p.allergies).length, color: '#8b5cf6' },
    { label: ACTIVE_SEGMENT, count: patients.length - inactive.length, color: '#22c55e' },
  ];

  const today = todayISO();
  const summary = {
    todayAppointments: appointments.filter((a) => a.appointment_date === today).length,
    activePlans: db.list('treatment_plans', (p) => p.status === 'active').length,
    pendingAmount: invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + (i.balance || 0), 0),
    openLabOrders: db.list('lab_orders', (o) => o.status !== 'delivered').length,
  };

  return { insights, segments, freeSlots: findFreeSlots(appointments, 7, 8), summary };
}

const HELP = `من می‌توانم در مورد موارد زیر کمک کنم:\n\n• اولین نوبت خالی کی است؟\n• وضعیت درآمد و مالی\n• بیماران غیرفعال و فرصت‌های بازگشت\n• نوبت‌های فردا\n• بدهی‌ها و مطالبات\n• درمان‌های ناتمام\n• تعداد بیماران\n• بهترین پیشنهادها\n\nسوال خود را دقیق‌تر بپرسید.`;

function firstFreeSlotAnswer(): string {
  const [slot] = findFreeSlots(db.list('appointments'), 14, 1);
  if (!slot) return 'در ۱۴ روز آینده هیچ نوبت خالی یافت نشد.';
  return `نزدیک‌ترین نوبت خالی:\n\n${slot.dayName}، ${formatDateShort(slot.date)}\nساعت ${formatTime(slot.time)}\n\nبرای رزرو این نوبت به بخش نوبت‌دهی مراجعه کنید.`;
}

/** Answers a free-text question by keyword, using the insights already computed. */
export function answerQuestion(question: string, { insights, segments }: AssistantData): string {
  const q = question.trim();
  const has = (...words: string[]) => words.some((w) => q.includes(w));
  const insight = (id: string) => insights.find((i) => i.id === id);

  if (isSlotQuestion(q)) return firstFreeSlotAnswer();

  if (has('درآمد', 'پول', 'مالی')) {
    const revenue = insights.find((i) => i.type === 'revenue');
    const debt = insight('pending-payments');
    let response = `بر اساس داده‌های فعلی:\n\n`;
    if (revenue) response += `• ${revenue.description}\n`;
    if (debt) response += `• ${debt.description}\n`;
    return response + `\nپیشنهاد: پیگیری مطالبات معوق و تماس با بیماران غیرفعال می‌تواند درآمد را افزایش دهد.`;
  }
  if (has('بیمار') && has('غیرفعال', 'برنگشت', 'برگشت')) {
    const inactive = segments.find((s) => s.label.includes('غیرفعال'));
    return inactive
      ? `${formatNumber(inactive.count)} بیمار بیش از ۶ ماه مراجعه نکرده‌اند.\n\nپیشنهاد: ارسال پیام پیگیری به این بیماران با پیشنهاد چکاپ رایگان یا تخفیف ویژه.`
      : 'هیچ بیمار غیرفعالی یافت نشد.';
  }
  if (has('فردا', 'آینده')) {
    return insight('tomorrow-opportunity')?.description ?? 'برای فردا هیچ نوبتی برنامه‌ریزی نشده است.';
  }
  if (has('بده', 'بدهی', 'قسط')) {
    return insight('pending-payments')?.description ?? 'هیچ بدهی معوقی وجود ندارد.';
  }
  if ((has('درمان') && has('شروع')) || has('ناتمام')) {
    return insight('unfinished')?.description ?? 'همه درمان‌ها تکمیل شده‌اند.';
  }
  if (has('چند بیمار', 'تعداد بیمار')) {
    const active = segments.find((s) => s.label === ACTIVE_SEGMENT);
    const inactive = segments.find((s) => s.label.includes('غیرفعال'));
    return `بیماران فعال: ${active ? formatNumber(active.count) : '۰'}\nبیماران غیرفعال: ${inactive ? formatNumber(inactive.count) : '۰'}\n\nپیشنهاد: تمرکز روی بیماران غیرفعال می‌تواند درآمد را افزایش دهد.`;
  }
  if (has('بهترین', 'پیشنهاد', 'توصیه')) {
    const top = insights.slice(0, 3);
    return `برترین پیشنهادها:\n\n${top.map((i, idx) => `${idx + 1}. ${i.title}: ${i.description}`).join('\n\n')}`;
  }
  return HELP;
}

/** Whether a question asks for the next free appointment slot. */
export function isSlotQuestion(question: string): boolean {
  return question.includes('نوبت') && ['خالی', 'اول', 'باز', 'آزاد'].some((w) => question.includes(w));
}
