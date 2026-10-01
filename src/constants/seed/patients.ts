import type { Patient } from '@/lib/types';
import { timestampFromNow } from '@/lib/date';

// Fictional patients. `balance` equals the sum of each patient's open invoice balances in billing.ts.
const base = {
  email: null,
  address: null,
  blood_type: null,
  allergies: null,
  medical_history: null,
  emergency_contact: null,
  emergency_phone: null,
  insurance_company: null,
  insurance_number: null,
  notes: null,
  balance: 0,
  status: 'active',
} satisfies Partial<Patient>;

export const patients: Patient[] = [
  {
    ...base,
    id: 'pat-01', first_name: 'محمد', last_name: 'حسینی', national_id: '0012345678', phone: '09121110001',
    email: 'm.hosseini@example.com', birth_date: '1985-04-12', gender: 'male', address: 'تهران، سعادت‌آباد',
    blood_type: 'O+', allergies: 'پنی‌سیلین', insurance_company: 'بیمه دی', insurance_number: 'D-448120',
    created_at: timestampFromNow(-320),
  },
  {
    ...base,
    id: 'pat-02', first_name: 'فاطمه', last_name: 'محمدی', national_id: '0023456789', phone: '09121110002',
    birth_date: '1992-09-03', gender: 'female', address: 'تهران، ونک', blood_type: 'A+',
    emergency_contact: 'حسین محمدی', emergency_phone: '09121119002', balance: 8_000_000,
    created_at: timestampFromNow(-210),
  },
  {
    ...base,
    id: 'pat-03', first_name: 'علیرضا', last_name: 'کاظمی', national_id: '0034567890', phone: '09121110003',
    birth_date: '1978-01-25', gender: 'male', medical_history: 'فشار خون بالا - مصرف لوزارتان',
    insurance_company: 'بیمه ایران', insurance_number: 'IR-99315', balance: 3_300_000,
    created_at: timestampFromNow(-180),
  },
  {
    ...base,
    id: 'pat-04', first_name: 'زهرا', last_name: 'رحیمی', national_id: '0045678901', phone: '09121110004',
    birth_date: '2001-06-30', gender: 'female', balance: 1_200_000,
    created_at: timestampFromNow(-45),
  },
  {
    ...base,
    id: 'pat-05', first_name: 'امیر', last_name: 'نوری', national_id: '0056789012', phone: '09121110005',
    birth_date: '1995-11-18', gender: 'male', email: 'amir.nouri@example.com',
    created_at: timestampFromNow(-140),
  },
  {
    ...base,
    id: 'pat-06', first_name: 'مریم', last_name: 'صادقی', national_id: '0067890123', phone: '09121110006',
    birth_date: '1969-03-08', gender: 'female', medical_history: 'دیابت نوع ۲', allergies: 'لاتکس',
    emergency_contact: 'نادر صادقی', emergency_phone: '09121119006', balance: 21_000_000,
    created_at: timestampFromNow(-260),
  },
  {
    ...base,
    id: 'pat-07', first_name: 'حسین', last_name: 'جعفری', national_id: '0078901234', phone: '09121110007',
    birth_date: '1988-12-02', gender: 'male',
    created_at: timestampFromNow(-300),
  },
  {
    ...base,
    id: 'pat-08', first_name: 'نرگس', last_name: 'اکبری', national_id: '0089012345', phone: '09121110008',
    birth_date: '1999-02-14', gender: 'female', insurance_company: 'بیمه آسیا', insurance_number: 'AS-51007',
    created_at: timestampFromNow(-12),
  },
  {
    ...base,
    id: 'pat-09', first_name: 'رضا', last_name: 'مرادی', national_id: '0090123456', phone: '09121110009',
    birth_date: '1982-07-21', gender: 'male',
    created_at: timestampFromNow(-60),
  },
  {
    ...base,
    id: 'pat-10', first_name: 'سمیرا', last_name: 'قاسمی', national_id: '0101234567', phone: '09121110010',
    birth_date: '1990-05-09', gender: 'female', balance: 1_500_000, notes: 'ترجیح نوبت‌های صبح',
    created_at: timestampFromNow(-40),
  },
  {
    ...base,
    id: 'pat-11', first_name: 'کامران', last_name: 'یوسفی', national_id: '0112345678', phone: '09121110011',
    birth_date: '1975-10-11', gender: 'male', status: 'inactive',
    created_at: timestampFromNow(-380),
  },
  {
    ...base,
    id: 'pat-12', first_name: 'لیلا', last_name: 'بهرامی', national_id: '0123456780', phone: '09121110012',
    birth_date: '2010-08-27', gender: 'female', emergency_contact: 'پروین بهرامی (مادر)', emergency_phone: '09121119012',
    created_at: timestampFromNow(-3),
  },
];
