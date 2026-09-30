import type { Lab, LabOrder, LabPayment, LabService } from '@/lib/types';
import { dateOffset, timestampOffset } from './dates';

export const labs: Lab[] = [
  { id: 'lab-01', name: 'لابراتوار دندانسازی آریا', contact_person: 'مهندس کیانی', phone: '021-66554433', email: 'aria.lab@example.com', address: 'تهران، خیابان انقلاب', balance: 5_700_000, active: true, created_at: timestampOffset(-400) },
  { id: 'lab-02', name: 'لابراتوار دیجیتال پارس', contact_person: 'خانم شریفی', phone: '021-22446688', email: null, address: 'تهران، میرداماد', balance: 3_500_000, active: true, created_at: timestampOffset(-200) },
];

export const labServices: LabService[] = [
  { id: 'ls-01', lab_id: 'lab-01', name: 'روکش زیرکونیا', price: 3_500_000, description: null, created_at: timestampOffset(-400) },
  { id: 'ls-02', lab_id: 'lab-01', name: 'روکش PFM', price: 2_200_000, description: 'فلز - سرامیک', created_at: timestampOffset(-400) },
  { id: 'ls-03', lab_id: 'lab-01', name: 'پروتز پارسیل', price: 6_000_000, description: null, created_at: timestampOffset(-400) },
  { id: 'ls-04', lab_id: 'lab-02', name: 'لمینت سرامیکی', price: 3_000_000, description: 'به ازای هر واحد', created_at: timestampOffset(-200) },
  { id: 'ls-05', lab_id: 'lab-02', name: 'روکش روی ایمپلنت', price: 4_000_000, description: null, created_at: timestampOffset(-200) },
];

export const labOrders: LabOrder[] = [
  { id: 'lo-01', lab_id: 'lab-01', patient_id: 'pat-02', staff_id: 'stf-01', service_name: 'روکش زیرکونیا', tooth_numbers: '16', description: null, price: 3_500_000, status: 'delivered', order_date: dateOffset(-50), due_date: dateOffset(-42), delivered_date: dateOffset(-41), notes: 'رنگ A2', created_at: timestampOffset(-50) },
  { id: 'lo-02', lab_id: 'lab-02', patient_id: 'pat-06', staff_id: 'stf-01', service_name: 'روکش روی ایمپلنت', tooth_numbers: '36', description: null, price: 4_000_000, status: 'in_progress', order_date: dateOffset(-5), due_date: dateOffset(2), delivered_date: null, notes: null, created_at: timestampOffset(-5) },
  { id: 'lo-03', lab_id: 'lab-01', patient_id: 'pat-01', staff_id: 'stf-01', service_name: 'روکش زیرکونیا', tooth_numbers: '16', description: 'قالب دیجیتال ارسال شد', price: 3_500_000, status: 'ready', order_date: dateOffset(-8), due_date: dateOffset(0), delivered_date: null, notes: 'رنگ A1', created_at: timestampOffset(-8) },
  { id: 'lo-04', lab_id: 'lab-01', patient_id: 'pat-03', staff_id: 'stf-02', service_name: 'روکش PFM', tooth_numbers: '46', description: null, price: 2_200_000, status: 'pending', order_date: dateOffset(-1), due_date: dateOffset(10), delivered_date: null, notes: null, created_at: timestampOffset(-1) },
];

export const labPayments: LabPayment[] = [
  { id: 'lp-01', lab_id: 'lab-01', lab_order_id: 'lo-01', amount: 3_500_000, payment_method: 'transfer', payment_date: dateOffset(-38), reference_number: 'TR-550012', notes: null, created_at: timestampOffset(-38) },
  { id: 'lp-02', lab_id: 'lab-02', lab_order_id: null, amount: 500_000, payment_method: 'cash', payment_date: dateOffset(-4), reference_number: null, notes: 'پیش‌پرداخت', created_at: timestampOffset(-4) },
];
