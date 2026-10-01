import { describe, expect, it } from 'vitest';
import { seedData } from './index';

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

describe('sample data is internally consistent', () => {
  it('gives every row a unique id', () => {
    for (const [table, rows] of Object.entries(seedData)) {
      const ids = rows.map((r: { id: string }) => r.id);
      expect(new Set(ids).size, table).toBe(ids.length);
    }
  });

  it('keeps each patient balance equal to their open invoice balances', () => {
    for (const patient of seedData.patients) {
      const owed = sum(seedData.invoices.filter((i) => i.patient_id === patient.id).map((i) => i.balance));
      expect(patient.balance, patient.id).toBe(owed);
    }
  });

  it('keeps payments equal to what each invoice says was paid', () => {
    for (const invoice of seedData.invoices) {
      const paid = sum(seedData.payments.filter((p) => p.invoice_id === invoice.id).map((p) => p.amount));
      expect(paid, invoice.id).toBe(invoice.paid_amount);
      expect(invoice.balance, invoice.id).toBe(invoice.total - invoice.paid_amount);
    }
  });

  it('keeps invoice items and installments equal to the invoice total', () => {
    for (const invoice of seedData.invoices) {
      expect(sum(seedData.invoice_items.filter((i) => i.invoice_id === invoice.id).map((i) => i.total)), invoice.id).toBe(invoice.total);
      const installments = seedData.installments.filter((i) => i.invoice_id === invoice.id);
      expect(installments, invoice.id).toHaveLength(invoice.installment_count);
      if (installments.length > 0) expect(sum(installments.map((i) => i.amount)), invoice.id).toBe(invoice.total);
    }
  });

  it('only references rows that exist', () => {
    const ids = (table: keyof typeof seedData) => new Set(seedData[table].map((r: { id: string }) => r.id));
    const patients = ids('patients');
    const staff = ids('staff');
    const services = ids('services');
    const invoices = ids('invoices');
    const labs = ids('labs');
    for (const a of seedData.appointments) {
      expect(patients.has(a.patient_id), a.id).toBe(true);
      expect(!a.staff_id || staff.has(a.staff_id), a.id).toBe(true);
      expect(!a.service_id || services.has(a.service_id), a.id).toBe(true);
    }
    for (const i of seedData.invoices) expect(patients.has(i.patient_id), i.id).toBe(true);
    for (const p of seedData.payments) expect(invoices.has(p.invoice_id), p.id).toBe(true);
    for (const o of seedData.lab_orders) {
      expect(labs.has(o.lab_id), o.id).toBe(true);
      expect(patients.has(o.patient_id), o.id).toBe(true);
    }
  });
});
