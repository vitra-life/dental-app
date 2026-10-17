import type { Installment, Invoice, InvoiceItem, Payment } from '@/lib/types';
import { daysFromToday, timestampFromNow } from '@/lib/date';
import { apt, pat, svc } from './ids';

function invoice(
  id: string,
  number: number,
  patient_id: string,
  appointment_id: string,
  day: number,
  total: number,
  paid_amount: number,
  installment_count = 0,
  treatment_plan_id: string | null = null,
): Invoice {
  const balance = total - paid_amount;
  return {
    id,
    patient_id,
    appointment_id,
    treatment_plan_id,
    invoice_number: `INV-${number}`,
    subtotal: total,
    tax_amount: 0,
    discount: 0,
    total,
    paid_amount,
    balance,
    status: balance <= 0 ? 'paid' : paid_amount > 0 ? 'partial' : 'unpaid',
    payment_type: installment_count > 0 ? 'installment' : 'full',
    installment_count,
    notes: null,
    created_at: timestampFromNow(day),
  };
}

// `day` is relative to today. Totals match the linked appointment's price.
export const invoices: Invoice[] = [
  invoice('inv-01', 100101, pat(1), apt(1), -150, 2_800_000, 2_800_000),
  invoice('inv-02', 100102, pat(11), apt(2), -240, 300_000, 300_000),
  invoice('inv-03', 100103, pat(7), apt(3), -100, 4_500_000, 4_500_000),
  invoice('inv-04', 100104, pat(6), apt(4), -70, 35_000_000, 14_000_000, 5, 'tp-02'),
  invoice('inv-05', 100105, pat(5), apt(5), -65, 5_000_000, 5_000_000),
  invoice('inv-06', 100106, pat(2), apt(6), -40, 12_000_000, 4_000_000, 3),
  invoice('inv-07', 100107, pat(10), apt(7), -35, 1_500_000, 0),
  invoice('inv-08', 100108, pat(3), apt(8), -20, 6_300_000, 3_000_000),
  invoice('inv-09', 100109, pat(1), apt(9), -10, 1_200_000, 1_200_000),
  invoice('inv-10', 100110, pat(9), apt(10), -6, 2_500_000, 2_500_000),
  invoice('inv-11', 100111, pat(4), apt(12), -3, 1_200_000, 0),
  invoice('inv-12', 100112, pat(12), apt(14), -2, 300_000, 300_000),
  invoice('inv-13', 100113, pat(8), apt(15), -1, 1_800_000, 1_800_000),
  invoice('inv-14', 100114, pat(2), apt(16), -1, 300_000, 300_000),
];

function item(id: string, invoice_id: string, service_id: string, description: string, unit_price: number, quantity = 1, day = -1): InvoiceItem {
  return { id, invoice_id, service_id, description, quantity, unit_price, total: unit_price * quantity, created_at: timestampFromNow(day) };
}

export const invoiceItems: InvoiceItem[] = [
  item('itm-01', 'inv-01', svc(1), 'ویزیت و معاینه', 300_000, 1, -150),
  item('itm-02', 'inv-01', svc(3), 'ترمیم کامپوزیت', 2_500_000, 1, -150),
  item('itm-03', 'inv-02', svc(1), 'ویزیت و معاینه', 300_000, 1, -240),
  item('itm-04', 'inv-03', svc(6), 'جراحی دندان عقل', 4_500_000, 1, -100),
  item('itm-05', 'inv-04', svc(8), 'ایمپلنت', 35_000_000, 1, -70),
  item('itm-06', 'inv-05', svc(9), 'بلیچینگ', 5_000_000, 1, -65),
  item('itm-07', 'inv-06', svc(7), 'روکش زیرکونیا', 12_000_000, 1, -40),
  item('itm-08', 'inv-07', svc(5), 'کشیدن دندان', 1_500_000, 1, -35),
  item('itm-09', 'inv-08', svc(1), 'ویزیت و معاینه', 300_000, 1, -20),
  item('itm-10', 'inv-08', svc(4), 'عصب‌کشی', 6_000_000, 1, -20),
  item('itm-11', 'inv-09', svc(2), 'جرمگیری و بروساژ', 1_200_000, 1, -10),
  item('itm-12', 'inv-10', svc(3), 'ترمیم کامپوزیت', 2_500_000, 1, -6),
  item('itm-13', 'inv-11', svc(2), 'جرمگیری و بروساژ', 1_200_000, 1, -3),
  item('itm-14', 'inv-12', svc(1), 'ویزیت و معاینه', 300_000, 1, -2),
  item('itm-15', 'inv-13', svc(1), 'ویزیت و معاینه', 300_000, 1, -1),
  item('itm-16', 'inv-13', svc(5), 'کشیدن دندان', 1_500_000, 1, -1),
  item('itm-17', 'inv-14', svc(1), 'ویزیت و معاینه', 300_000, 1, -1),
];

function payment(id: string, invoice_id: string, patient_id: string, amount: number, day: number, payment_method: Payment['payment_method'], reference_number: string | null = null): Payment {
  return { id, invoice_id, patient_id, amount, payment_method, payment_date: daysFromToday(day), reference_number, notes: null, created_at: timestampFromNow(day) };
}

// Per invoice, payments add up to its `paid_amount`.
export const payments: Payment[] = [
  payment('pay-01', 'inv-01', pat(1), 2_800_000, -150, 'card'),
  payment('pay-02', 'inv-02', pat(11), 300_000, -240, 'cash'),
  payment('pay-03', 'inv-03', pat(7), 4_500_000, -100, 'transfer', 'TR-771204'),
  payment('pay-04', 'inv-04', pat(6), 7_000_000, -40, 'card'),
  payment('pay-05', 'inv-04', pat(6), 7_000_000, -10, 'online', 'ON-310552'),
  payment('pay-06', 'inv-05', pat(5), 5_000_000, -65, 'card'),
  payment('pay-07', 'inv-06', pat(2), 4_000_000, -10, 'card'),
  payment('pay-08', 'inv-08', pat(3), 3_000_000, -20, 'cash'),
  payment('pay-09', 'inv-09', pat(1), 1_200_000, -10, 'card'),
  payment('pay-10', 'inv-10', pat(9), 2_500_000, -6, 'online', 'ON-318870'),
  payment('pay-11', 'inv-12', pat(12), 300_000, -2, 'cash'),
  payment('pay-12', 'inv-13', pat(8), 1_800_000, -1, 'card'),
  payment('pay-13', 'inv-14', pat(2), 300_000, -1, 'cash'),
];

function installment(id: string, invoice_id: string, installment_number: number, amount: number, dueDay: number, payment_id: string | null = null, paidDay?: number): Installment {
  return {
    id,
    invoice_id,
    installment_number,
    amount,
    due_date: daysFromToday(dueDay),
    paid: payment_id !== null,
    paid_date: paidDay === undefined ? null : daysFromToday(paidDay),
    payment_id,
    created_at: timestampFromNow(-70),
  };
}

export const installments: Installment[] = [
  // inv-04: implant, 5 × 7,000,000, two paid
  installment('ins-01', 'inv-04', 1, 7_000_000, -40, 'pay-04', -40),
  installment('ins-02', 'inv-04', 2, 7_000_000, -10, 'pay-05', -10),
  installment('ins-03', 'inv-04', 3, 7_000_000, 20),
  installment('ins-04', 'inv-04', 4, 7_000_000, 50),
  installment('ins-05', 'inv-04', 5, 7_000_000, 80),
  // inv-06: crown, 3 × 4,000,000, one paid
  installment('ins-06', 'inv-06', 1, 4_000_000, -10, 'pay-07', -10),
  installment('ins-07', 'inv-06', 2, 4_000_000, 5),
  installment('ins-08', 'inv-06', 3, 4_000_000, 35),
];
