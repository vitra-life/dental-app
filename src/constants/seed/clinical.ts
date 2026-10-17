import type { DentalRecord, RvgImage, Treatment, TreatmentPlan, TreatmentPlanItem, TreatmentPlanTemplate } from '@/lib/types';
import { daysFromToday, timestampFromNow } from '@/lib/date';
import { apt, pat, svc } from './ids';

export const treatments: Treatment[] = [
  { id: 'trt-01', patient_id: pat(1), appointment_id: apt(1), staff_id: 'stf-01', service_id: svc(3), tooth_number: 36, description: 'ترمیم کلاس II', status: 'completed', cost: 2_500_000, treatment_date: daysFromToday(-150), notes: null, created_at: timestampFromNow(-150) },
  { id: 'trt-02', patient_id: pat(1), appointment_id: apt(9), staff_id: 'stf-03', service_id: svc(2), tooth_number: null, description: 'جرمگیری کامل فک بالا و پایین', status: 'completed', cost: 1_200_000, treatment_date: daysFromToday(-10), notes: null, created_at: timestampFromNow(-10) },
  { id: 'trt-03', patient_id: pat(2), appointment_id: apt(6), staff_id: 'stf-01', service_id: svc(7), tooth_number: 16, description: 'روکش زیرکونیا روی دندان عصب‌کشی شده', status: 'completed', cost: 12_000_000, treatment_date: daysFromToday(-40), notes: null, created_at: timestampFromNow(-40) },
  { id: 'trt-04', patient_id: pat(3), appointment_id: apt(8), staff_id: 'stf-02', service_id: svc(4), tooth_number: 46, description: 'درمان ریشه - جلسه اول', status: 'completed', cost: 6_000_000, treatment_date: daysFromToday(-20), notes: 'نیاز به جلسه دوم', created_at: timestampFromNow(-20) },
  { id: 'trt-05', patient_id: pat(6), appointment_id: apt(4), staff_id: 'stf-01', service_id: svc(8), tooth_number: 36, description: 'کاشت فیکسچر', status: 'completed', cost: 35_000_000, treatment_date: daysFromToday(-70), notes: null, created_at: timestampFromNow(-70) },
  { id: 'trt-06', patient_id: pat(7), appointment_id: apt(3), staff_id: 'stf-02', service_id: svc(6), tooth_number: 38, description: 'جراحی عقل نهفته فک پایین', status: 'completed', cost: 4_500_000, treatment_date: daysFromToday(-100), notes: null, created_at: timestampFromNow(-100) },
  { id: 'trt-07', patient_id: pat(8), appointment_id: apt(15), staff_id: 'stf-02', service_id: svc(5), tooth_number: 18, description: null, status: 'completed', cost: 1_500_000, treatment_date: daysFromToday(-1), notes: null, created_at: timestampFromNow(-1) },
];

function record(id: string, patient_id: string, tooth_number: number, status: DentalRecord['status'], treatment_type: string | null, day: number | null, notes: string | null = null): DentalRecord {
  return {
    id,
    patient_id,
    tooth_number,
    status,
    treatment_type,
    treatment_date: day === null ? null : daysFromToday(day),
    notes,
    created_at: timestampFromNow(day ?? -30),
  };
}

export const dentalRecords: DentalRecord[] = [
  record('dr-01', pat(1), 36, 'treated', 'ترمیم کامپوزیت', -150),
  record('dr-02', pat(1), 16, 'planned', 'روکش زیرکونیا', null),
  record('dr-03', pat(1), 25, 'decayed', null, -10, 'پوسیدگی سطحی'),
  record('dr-04', pat(2), 16, 'treated', 'روکش زیرکونیا', -40),
  record('dr-05', pat(2), 26, 'planned', 'عصب‌کشی', null),
  record('dr-06', pat(3), 46, 'in_progress', 'عصب‌کشی', -20),
  record('dr-07', pat(3), 47, 'decayed', null, -20),
  record('dr-08', pat(6), 36, 'in_progress', 'ایمپلنت', -70, 'منتظر روکش'),
  record('dr-09', pat(6), 46, 'extracted', null, -300),
  record('dr-10', pat(7), 38, 'extracted', 'جراحی دندان عقل', -100),
  record('dr-11', pat(8), 18, 'extracted', 'کشیدن دندان', -1),
];

/** Inline SVG stand-in for a radiograph, so the sample data needs no external files. */
function xrayPlaceholder(label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
<defs><radialGradient id="g" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#6b7280"/><stop offset="1" stop-color="#111827"/></radialGradient></defs>
<rect width="400" height="300" fill="url(#g)"/>
<path d="M150 60c-30 0-45 30-40 70s20 110 35 110 20-50 30-50 15 50 30 50 30-70 35-110-10-70-40-70c-20 0-25 10-25 10s-5-10-25-10z" fill="#e5e7eb" opacity=".85"/>
<text x="200" y="285" font-family="sans-serif" font-size="16" fill="#d1d5db" text-anchor="middle">${label}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const rvgImages: RvgImage[] = [
  { id: 'rvg-01', patient_id: pat(3), image_url: xrayPlaceholder('RVG #46'), image_type: 'rvg', tooth_number: 46, description: 'قبل از درمان ریشه', device_info: 'Sample sensor', created_at: timestampFromNow(-20) },
  { id: 'rvg-02', patient_id: pat(6), image_url: xrayPlaceholder('RVG #36'), image_type: 'rvg', tooth_number: 36, description: 'پس از کاشت ایمپلنت', device_info: 'Sample sensor', created_at: timestampFromNow(-70) },
  { id: 'rvg-03', patient_id: pat(7), image_url: xrayPlaceholder('RVG #38'), image_type: 'rvg', tooth_number: 38, description: 'دندان عقل نهفته', device_info: 'Sample sensor', created_at: timestampFromNow(-101) },
];

export const treatmentPlans: TreatmentPlan[] = [
  { id: 'tp-01', patient_id: pat(1), title: 'بازسازی دندان‌های خلفی', total_estimated_cost: 14_500_000, status: 'active', start_date: daysFromToday(-10), target_end_date: daysFromToday(60), notes: null, created_at: timestampFromNow(-10) },
  { id: 'tp-02', patient_id: pat(6), title: 'ایمپلنت و روکش فک پایین', total_estimated_cost: 47_000_000, status: 'active', start_date: daysFromToday(-70), target_end_date: daysFromToday(30), notes: 'بیمار دیابتی - کنترل قند قبل از هر جلسه', created_at: timestampFromNow(-70) },
  { id: 'tp-03', patient_id: pat(7), title: 'جراحی دندان عقل', total_estimated_cost: 4_500_000, status: 'completed', start_date: daysFromToday(-110), target_end_date: daysFromToday(-100), notes: null, created_at: timestampFromNow(-110) },
];

function planItem(
  id: string,
  plan_id: string,
  patient_id: string,
  service_id: string,
  tooth_number: number | null,
  description: string,
  estimated_cost: number,
  status: TreatmentPlanItem['status'],
  sort_order: number,
  extra: Partial<TreatmentPlanItem> = {},
): TreatmentPlanItem {
  return {
    id, plan_id, patient_id, service_id, tooth_number, description, estimated_cost, status, sort_order,
    actual_cost: status === 'completed' ? estimated_cost : 0,
    appointment_id: null,
    installment_id: null,
    due_date: null,
    completed_date: null,
    notes: null,
    created_at: timestampFromNow(-10),
    ...extra,
  };
}

export const treatmentPlanItems: TreatmentPlanItem[] = [
  planItem('tpi-01', 'tp-01', pat(1), svc(2), null, 'جرمگیری و بروساژ', 1_200_000, 'completed', 1, { completed_date: daysFromToday(-10), appointment_id: apt(9) }),
  planItem('tpi-02', 'tp-01', pat(1), svc(3), 25, 'ترمیم کامپوزیت', 2_500_000, 'planned', 2, { due_date: daysFromToday(20) }),
  planItem('tpi-03', 'tp-01', pat(1), svc(7), 16, 'روکش زیرکونیا', 10_800_000, 'in_progress', 3, { appointment_id: apt(23), due_date: daysFromToday(1), notes: 'تخفیف ۱۰٪ اعمال شده' }),
  planItem('tpi-04', 'tp-02', pat(6), svc(8), 36, 'ایمپلنت', 35_000_000, 'completed', 1, { completed_date: daysFromToday(-70), appointment_id: apt(4), created_at: timestampFromNow(-70) }),
  planItem('tpi-05', 'tp-02', pat(6), svc(7), 36, 'روکش روی ایمپلنت', 12_000_000, 'planned', 2, { appointment_id: apt(25), due_date: daysFromToday(2), created_at: timestampFromNow(-70) }),
  planItem('tpi-06', 'tp-03', pat(7), svc(6), 38, 'جراحی دندان عقل', 4_500_000, 'completed', 1, { completed_date: daysFromToday(-100), appointment_id: apt(3), created_at: timestampFromNow(-110) }),
];

const templateItem = (service_id: string, description: string, price: number) => ({ service_id, description, price });

// Prices are the services' default prices.
export const treatmentPlanTemplates: TreatmentPlanTemplate[] = [
  {
    id: 'tpt-01',
    name: 'پکیج ایمپلنت استاندارد',
    description: 'معاینه، کاشت ایمپلنت و روکش نهایی',
    items: [templateItem(svc(1), 'ویزیت و معاینه', 300_000), templateItem(svc(8), 'ایمپلنت', 35_000_000), templateItem(svc(7), 'روکش زیرکونیا', 12_000_000)],
    active: true,
    created_at: timestampFromNow(-200),
  },
  {
    id: 'tpt-02',
    name: 'درمان ریشه و روکش',
    description: 'عصب‌کشی، ترمیم و روکش دندان خلفی',
    items: [templateItem(svc(4), 'عصب‌کشی', 6_000_000), templateItem(svc(3), 'ترمیم کامپوزیت', 2_500_000), templateItem(svc(7), 'روکش زیرکونیا', 12_000_000)],
    active: true,
    created_at: timestampFromNow(-200),
  },
  {
    id: 'tpt-03',
    name: 'پکیج زیبایی لبخند',
    description: 'جرمگیری و بلیچینگ',
    items: [templateItem(svc(2), 'جرمگیری و بروساژ', 1_200_000), templateItem(svc(9), 'بلیچینگ', 5_000_000)],
    active: true,
    created_at: timestampFromNow(-120),
  },
];
