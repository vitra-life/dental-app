import { describe, expect, it } from 'vitest';
import { apt, pat, svc } from './ids';
import { seedData } from './index';

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

describe('sample data is internally consistent', () => {
  it('gives every row a unique id', () => {
    for (const [table, rows] of Object.entries(seedData)) {
      const ids = rows.map((r: { id: string }) => r.id);
      expect(new Set(ids).size, table).toBe(ids.length);
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
    // Patients, services and appointments are the backend dev seed's fixed ids.
    const range = (make: (n: number) => string, count: number) => new Set(Array.from({ length: count }, (_, i) => make(i + 1)));
    const patients = range(pat, 12);
    const services = range(svc, 11);
    const appointments = range(apt, 28);
    const invoices = ids('invoices');
    const labs = ids('labs');
    const plans = ids('treatment_plans');
    for (const i of seedData.invoices) {
      expect(patients.has(i.patient_id), i.id).toBe(true);
      expect(!i.treatment_plan_id || plans.has(i.treatment_plan_id), i.id).toBe(true);
    }
    for (const item of seedData.treatment_plan_items) {
      expect(plans.has(item.plan_id), item.id).toBe(true);
      expect(!item.appointment_id || appointments.has(item.appointment_id), item.id).toBe(true);
    }
    for (const template of seedData.treatment_plan_templates) {
      for (const item of template.items) expect(!item.service_id || services.has(item.service_id), template.id).toBe(true);
    }
    for (const p of seedData.payments) expect(invoices.has(p.invoice_id), p.id).toBe(true);
    for (const o of seedData.lab_orders) {
      expect(labs.has(o.lab_id), o.id).toBe(true);
      expect(patients.has(o.patient_id), o.id).toBe(true);
    }
  });
});
