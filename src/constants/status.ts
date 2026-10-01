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
  icon?: LucideIcon;
}

type StatusMap<S extends string> = Record<S, StatusStyle>;

/** Looks a status up, falling back to `fallback` for values the map doesn't know. */
export function statusStyle<S extends string>(map: StatusMap<S>, status: string, fallback: S): StatusStyle {
  return (map as Record<string, StatusStyle>)[status] ?? map[fallback];
}

export const appointmentStatus: StatusMap<Appointment['status']> = {
  pending: { label: 'در انتظار', bg: 'bg-warning-50', text: 'text-warning-600', icon: Clock },
  confirmed: { label: 'تایید شده', bg: 'bg-secondary-50', text: 'text-secondary-600', icon: CheckCircle2 },
  completed: { label: 'تکمیل شده', bg: 'bg-accent-50', text: 'text-accent-600', icon: CheckCircle2 },
  cancelled: { label: 'لغو شده', bg: 'bg-error-50', text: 'text-error-600', icon: XCircle },
  no_show: { label: 'غیبت', bg: 'bg-error-50', text: 'text-error-600', icon: XCircle },
};

export const invoiceStatus: StatusMap<Invoice['status']> = {
  paid: { label: 'پرداخت شده', bg: 'bg-accent-50', text: 'text-accent-600' },
  partial: { label: 'پرداخت جزئی', bg: 'bg-warning-50', text: 'text-warning-600' },
  unpaid: { label: 'پرداخت نشده', bg: 'bg-error-50', text: 'text-error-600' },
  overdue: { label: 'سررسید گذشته', bg: 'bg-error-100', text: 'text-error-700' },
};

export const labOrderStatus: StatusMap<LabOrder['status']> = {
  pending: { label: 'در انتظار', bg: 'bg-warning-50', text: 'text-warning-600', icon: Clock },
  in_progress: { label: 'در حال ساخت', bg: 'bg-secondary-50', text: 'text-secondary-600', icon: Clock },
  ready: { label: 'آماده', bg: 'bg-accent-50', text: 'text-accent-600', icon: CheckCircle2 },
  delivered: { label: 'تحویل شده', bg: 'bg-surface-100', text: 'text-surface-500', icon: Truck },
};

export const treatmentPlanStatus: StatusMap<TreatmentPlan['status']> = {
  active: { label: 'فعال', bg: 'bg-primary-50', text: 'text-primary-600' },
  completed: { label: 'تکمیل', bg: 'bg-accent-50', text: 'text-accent-600' },
  cancelled: { label: 'لغو', bg: 'bg-surface-100', text: 'text-surface-500' },
};

export const planItemStatus: StatusMap<TreatmentPlanItem['status']> = {
  planned: { label: 'برنامه‌ریزی', bg: 'bg-primary-50', text: 'text-primary-600' },
  in_progress: { label: 'در حال انجام', bg: 'bg-warning-50', text: 'text-warning-600' },
  completed: { label: 'تکمیل شده', bg: 'bg-accent-50', text: 'text-accent-600' },
  cancelled: { label: 'لغو شده', bg: 'bg-error-50', text: 'text-error-600' },
};

export const campaignStatus: StatusMap<SmsCampaign['status']> = {
  draft: { label: 'پیش‌نویس', bg: 'bg-surface-100', text: 'text-surface-500' },
  scheduled: { label: 'زمان‌بندی شده', bg: 'bg-secondary-50', text: 'text-secondary-600' },
  sending: { label: 'در حال ارسال', bg: 'bg-warning-50', text: 'text-warning-600' },
  completed: { label: 'تکمیل شده', bg: 'bg-accent-50', text: 'text-accent-600' },
  cancelled: { label: 'لغو شده', bg: 'bg-error-50', text: 'text-error-600' },
};

export const messageStatus: StatusMap<SmsMessage['status']> = {
  pending: { label: 'در انتظار', bg: 'bg-warning-50', text: 'text-warning-600', icon: Clock },
  sent: { label: 'ارسال شد', bg: 'bg-accent-50', text: 'text-accent-600', icon: CheckCircle2 },
  failed: { label: 'ناموفق', bg: 'bg-error-50', text: 'text-error-600', icon: XCircle },
};

/** Tooth states on the dental chart: badge colours, selection border and the chart fill colour. */
export const toothStatus: Record<DentalRecord['status'], StatusStyle & { border: string; color: string }> = {
  healthy: { label: 'سالم', bg: 'bg-accent-50', text: 'text-accent-600', border: 'border-accent-200', color: '#22c55e' },
  treated: { label: 'درمان شده', bg: 'bg-secondary-50', text: 'text-secondary-600', border: 'border-secondary-200', color: '#3b82f6' },
  in_progress: { label: 'در حال درمان', bg: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-200', color: '#f59e0b' },
  planned: { label: 'برنامه‌ریزی شده', bg: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-200', color: '#14b8a6' },
  extracted: { label: 'کشیده شده', bg: 'bg-surface-100', text: 'text-surface-500', border: 'border-surface-200', color: '#94a3b8' },
  decayed: { label: 'پوسیده', bg: 'bg-error-50', text: 'text-error-600', border: 'border-error-200', color: '#ef4444' },
};
