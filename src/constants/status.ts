import { CheckCircle2, Clock, Truck, XCircle, type LucideIcon } from 'lucide-react';
import type {
  Appointment,
  DentalRecord,
  Invoice,
  LabOrder,
  SmsCampaign,
  SmsMessage,
  TreatmentPlan,
  TreatmentPlanItem,
} from '@/lib/types';

/** How one status value is shown: its Persian label and its badge colours. */
export interface StatusStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon?: LucideIcon;
}

type StatusMap<S extends string> = Record<S, StatusStyle>;

/** Looks a status up, falling back to `fallback` for values the map doesn't know. */
export function statusStyle<S extends string>(map: StatusMap<S>, status: string, fallback: S): StatusStyle {
  return (map as Record<string, StatusStyle>)[status] ?? map[fallback];
}

export const appointmentStatus: StatusMap<Appointment['status']> = {
  pending: { label: 'رزرو شده', bg: 'bg-secondary-50', text: 'text-secondary-700', border: 'border-secondary-200', icon: Clock },
  confirmed: { label: 'تأیید شده', bg: 'bg-accent-50', text: 'text-accent-700', border: 'border-accent-200', icon: CheckCircle2 },
  completed: { label: 'انجام شد', bg: 'bg-surface-100', text: 'text-surface-600', border: 'border-surface-200', icon: CheckCircle2 },
  cancelled: { label: 'لغو شده', bg: 'bg-error-50', text: 'text-error-600', border: 'border-error-200', icon: XCircle },
  no_show: { label: 'غیبت', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', icon: XCircle },
};

export const invoiceStatus: StatusMap<Invoice['status']> = {
  paid: { label: 'پرداخت شده', bg: 'bg-accent-50', text: 'text-accent-700', border: 'border-accent-200' },
  partial: { label: 'نیمه‌پرداخت', bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-warning-200' },
  unpaid: { label: 'در انتظار', bg: 'bg-secondary-50', text: 'text-secondary-700', border: 'border-secondary-200' },
  overdue: { label: 'معوق', bg: 'bg-error-50', text: 'text-error-700', border: 'border-error-200' },
};

export const labOrderStatus: StatusMap<LabOrder['status']> = {
  pending: { label: 'در انتظار', bg: 'bg-surface-100', text: 'text-surface-600', border: 'border-surface-200', icon: Clock },
  in_progress: { label: 'در حال ساخت', bg: 'bg-secondary-50', text: 'text-secondary-700', border: 'border-secondary-200', icon: Clock },
  ready: { label: 'آماده تحویل', bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-warning-200', icon: CheckCircle2 },
  delivered: { label: 'تحویل داده شد', bg: 'bg-accent-50', text: 'text-accent-700', border: 'border-accent-200', icon: Truck },
};

export const treatmentPlanStatus: StatusMap<TreatmentPlan['status']> = {
  active: { label: 'فعال', bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-200' },
  completed: { label: 'تکمیل شده', bg: 'bg-accent-50', text: 'text-accent-700', border: 'border-accent-200' },
  cancelled: { label: 'لغو شده', bg: 'bg-surface-100', text: 'text-surface-600', border: 'border-surface-200' },
};

export const planItemStatus: StatusMap<TreatmentPlanItem['status']> = {
  planned: { label: 'برنامه‌ریزی‌شده', bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-warning-200' },
  in_progress: { label: 'در حال انجام', bg: 'bg-secondary-50', text: 'text-secondary-700', border: 'border-secondary-200' },
  completed: { label: 'تکمیل‌شده', bg: 'bg-accent-50', text: 'text-accent-700', border: 'border-accent-200' },
  cancelled: { label: 'لغو شده', bg: 'bg-error-50', text: 'text-error-600', border: 'border-error-200' },
};

export const campaignStatus: StatusMap<SmsCampaign['status']> = {
  draft: { label: 'پیش‌نویس', bg: 'bg-surface-100', text: 'text-surface-600', border: 'border-surface-200' },
  scheduled: { label: 'زمان‌بندی شده', bg: 'bg-secondary-50', text: 'text-secondary-700', border: 'border-secondary-200' },
  sending: { label: 'در حال ارسال', bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-warning-200' },
  completed: { label: 'تکمیل شده', bg: 'bg-accent-50', text: 'text-accent-700', border: 'border-accent-200' },
  cancelled: { label: 'لغو شده', bg: 'bg-error-50', text: 'text-error-600', border: 'border-error-200' },
};

export const messageStatus: StatusMap<SmsMessage['status']> = {
  pending: { label: 'در انتظار', bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-warning-200', icon: Clock },
  sent: { label: 'ارسال شد', bg: 'bg-accent-50', text: 'text-accent-700', border: 'border-accent-200', icon: CheckCircle2 },
  failed: { label: 'ناموفق', bg: 'bg-error-50', text: 'text-error-600', border: 'border-error-200', icon: XCircle },
};

/** Tooth states on the dental chart: badge colours and the soft fill colour of the tooth. */
export const toothStatus: Record<DentalRecord['status'], StatusStyle & { color: string }> = {
  healthy: { label: 'سالم', bg: 'bg-surface-100', text: 'text-surface-600', border: 'border-surface-200', color: '#ffffff' },
  treated: { label: 'درمان‌شده', bg: 'bg-accent-50', text: 'text-accent-700', border: 'border-accent-200', color: '#a7f3d0' },
  in_progress: { label: 'در حال درمان', bg: 'bg-secondary-50', text: 'text-secondary-700', border: 'border-secondary-200', color: '#bae6fd' },
  planned: { label: 'برنامه‌ریزی شده', bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-warning-200', color: '#fef08a' },
  extracted: { label: 'کشیده‌شده', bg: 'bg-surface-100', text: 'text-surface-600', border: 'border-surface-200', color: '#e2e8f0' },
  decayed: { label: 'پوسیده', bg: 'bg-error-50', text: 'text-error-600', border: 'border-error-200', color: '#fecaca' },
};
