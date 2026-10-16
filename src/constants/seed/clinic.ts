import type { ClinicSettings, Staff } from '@/lib/types';
import { timestampFromNow } from '@/lib/date';

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
    created_at: timestampFromNow(-400),
  },
];

export const staff: Staff[] = [
  { id: 'stf-01', full_name: 'دکتر سارا احمدی', role: 'dentist', phone: '09121234501', email: 'ahmadi@labkhand-clinic.ir', color: '#14b8a6', active: true, created_at: timestampFromNow(-400) },
  { id: 'stf-02', full_name: 'دکتر علی رضایی', role: 'dentist', phone: '09121234502', email: 'rezaei@labkhand-clinic.ir', color: '#3b82f6', active: true, created_at: timestampFromNow(-380) },
  { id: 'stf-03', full_name: 'دکتر مریم کریمی', role: 'dentist', phone: '09121234503', email: 'karimi@labkhand-clinic.ir', color: '#8b5cf6', active: true, created_at: timestampFromNow(-200) },
  { id: 'stf-04', full_name: 'نگار حسینی', role: 'receptionist', phone: '09121234504', email: null, color: '#f59e0b', active: true, created_at: timestampFromNow(-390) },
  { id: 'stf-05', full_name: 'رضا موسوی', role: 'accountant', phone: '09121234505', email: null, color: '#22c55e', active: true, created_at: timestampFromNow(-300) },
];

