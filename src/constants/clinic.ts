import type { ClinicSettings, Service, Staff } from '@/lib/types';
import { timestampOffset } from './dates';

export const clinicSettings: ClinicSettings[] = [
  {
    id: 'clinic-01',
    name: 'کلینیک دندانپزشکی لبخند',
    address: 'تهران، خیابان ولیعصر، بالاتر از پارک ساعی، پلاک ۱۲۴۰، طبقه ۳',
    phone: '021-88776655',
    email: 'info@labkhand-clinic.ir',
    logo_url: null,
    working_hours: {
      sat: { start: '09:00', end: '18:00' },
      sun: { start: '09:00', end: '18:00' },
      mon: { start: '09:00', end: '18:00' },
      tue: { start: '09:00', end: '18:00' },
      wed: { start: '09:00', end: '18:00' },
      thu: { start: '09:00', end: '14:00' },
      fri: null,
    },
    tax_rate: 0,
    currency: 'تومان',
    created_at: timestampOffset(-400),
  },
];

export const staff: Staff[] = [
  { id: 'stf-01', full_name: 'دکتر سارا احمدی', role: 'dentist', phone: '09121234501', email: 'ahmadi@labkhand-clinic.ir', color: '#14b8a6', active: true, created_at: timestampOffset(-400) },
  { id: 'stf-02', full_name: 'دکتر علی رضایی', role: 'dentist', phone: '09121234502', email: 'rezaei@labkhand-clinic.ir', color: '#3b82f6', active: true, created_at: timestampOffset(-380) },
  { id: 'stf-03', full_name: 'دکتر مریم کریمی', role: 'dentist', phone: '09121234503', email: 'karimi@labkhand-clinic.ir', color: '#8b5cf6', active: true, created_at: timestampOffset(-200) },
  { id: 'stf-04', full_name: 'نگار حسینی', role: 'receptionist', phone: '09121234504', email: null, color: '#f59e0b', active: true, created_at: timestampOffset(-390) },
  { id: 'stf-05', full_name: 'رضا موسوی', role: 'accountant', phone: '09121234505', email: null, color: '#22c55e', active: true, created_at: timestampOffset(-300) },
];

export const services: Service[] = [
  { id: 'svc-01', name: 'ویزیت و معاینه', category: 'general', default_price: 300_000, duration_minutes: 30, description: 'معاینه کامل دهان و دندان و تشکیل پرونده', active: true, created_at: timestampOffset(-400) },
  { id: 'svc-02', name: 'جرمگیری و بروساژ', category: 'general', default_price: 1_200_000, duration_minutes: 45, description: null, active: true, created_at: timestampOffset(-400) },
  { id: 'svc-03', name: 'ترمیم کامپوزیت', category: 'general', default_price: 2_500_000, duration_minutes: 45, description: 'پر کردن دندان با کامپوزیت همرنگ', active: true, created_at: timestampOffset(-400) },
  { id: 'svc-04', name: 'عصب‌کشی', category: 'endodontics', default_price: 6_000_000, duration_minutes: 60, description: 'درمان ریشه دندان‌های خلفی', active: true, created_at: timestampOffset(-400) },
  { id: 'svc-05', name: 'کشیدن دندان', category: 'surgery', default_price: 1_500_000, duration_minutes: 30, description: null, active: true, created_at: timestampOffset(-400) },
  { id: 'svc-06', name: 'جراحی دندان عقل', category: 'surgery', default_price: 4_500_000, duration_minutes: 60, description: 'جراحی دندان عقل نهفته', active: true, created_at: timestampOffset(-400) },
  { id: 'svc-07', name: 'روکش زیرکونیا', category: 'prosthodontics', default_price: 12_000_000, duration_minutes: 60, description: null, active: true, created_at: timestampOffset(-400) },
  { id: 'svc-08', name: 'ایمپلنت', category: 'surgery', default_price: 35_000_000, duration_minutes: 90, description: 'ایمپلنت با فیکسچر کره‌ای', active: true, created_at: timestampOffset(-400) },
  { id: 'svc-09', name: 'بلیچینگ', category: 'cosmetic', default_price: 5_000_000, duration_minutes: 60, description: 'سفید کردن دندان در مطب', active: true, created_at: timestampOffset(-400) },
  { id: 'svc-10', name: 'ارتودنسی ثابت', category: 'orthodontics', default_price: 60_000_000, duration_minutes: 45, description: null, active: true, created_at: timestampOffset(-400) },
  { id: 'svc-11', name: 'لمینت سرامیکی', category: 'cosmetic', default_price: 9_000_000, duration_minutes: 60, description: 'هزینه به ازای هر واحد', active: false, created_at: timestampOffset(-250) },
];
