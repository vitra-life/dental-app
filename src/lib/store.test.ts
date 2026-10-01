import { beforeEach, describe, expect, it } from 'vitest';
import * as db from './store';

beforeEach(() => {
  db.resetStore();
});

describe('reads', () => {
  it('returns copies, so callers cannot change stored rows', () => {
    const [first] = db.list('patients');
    first.first_name = 'changed';
    expect(db.get('patients', first.id)?.first_name).not.toBe('changed');
  });

  it('filters, finds and sorts', () => {
    expect(db.list('staff', (s) => s.role === 'dentist')).toHaveLength(3);
    expect(db.get('patients', 'missing')).toBeNull();
    expect(db.first('clinic_settings')?.id).toBe('clinic-01');
    const names = db.orderBy(db.list('services'), 'default_price', { ascending: false }).map((s) => s.id);
    expect(names[0]).toBe('svc-10');
  });

  it('attaches related rows', () => {
    const [apt] = db.withOne(db.list('appointments', (a) => a.id === 'apt-04'), 'patient', 'patients', 'patient_id');
    expect(apt.patient?.id).toBe('pat-06');
    const [plan] = db.withMany(db.list('treatment_plans', (p) => p.id === 'tp-01'), 'items', 'treatment_plan_items', 'plan_id');
    expect(plan.items).toHaveLength(3);
  });
});

describe('writes', () => {
  it('fills defaults, an id and created_at on insert', () => {
    const patient = db.insert('patients', { first_name: 'تست', last_name: 'آزمایشی', phone: '0912' });
    expect(patient.id).toBeTruthy();
    expect(patient.created_at).toBeTruthy();
    expect(patient.balance).toBe(0);
    expect(patient.status).toBe('active');
    expect(db.get('patients', patient.id)).toEqual(patient);
  });

  it('updates one row and leaves the rest', () => {
    db.update('patients', 'pat-01', { phone: '000' });
    expect(db.get('patients', 'pat-01')?.phone).toBe('000');
    expect(db.get('patients', 'pat-02')?.phone).toBe('09121110002');
    expect(db.update('patients', 'missing', { phone: '1' })).toBeNull();
  });

  it('persists to localStorage and restores the sample data on reset', () => {
    db.update('patients', 'pat-01', { phone: '000' });
    expect(localStorage.getItem('dentaclinic:data:v1')).toContain('"phone":"000"');
    db.resetStore();
    expect(localStorage.getItem('dentaclinic:data:v1')).toBeNull();
    expect(db.get('patients', 'pat-01')?.phone).toBe('09121110001');
  });
});

describe('deletes follow the foreign keys', () => {
  it('cascades from a patient to everything they own', () => {
    db.remove('patients', 'pat-06');
    expect(db.list('appointments', (a) => a.patient_id === 'pat-06')).toHaveLength(0);
    expect(db.list('invoices', (i) => i.patient_id === 'pat-06')).toHaveLength(0);
    // Two levels down: the invoice's installments and items go too.
    expect(db.list('installments', (i) => i.invoice_id === 'inv-04')).toHaveLength(0);
    expect(db.list('invoice_items', (i) => i.invoice_id === 'inv-04')).toHaveLength(0);
    expect(db.list('treatment_plan_items', (i) => i.plan_id === 'tp-02')).toHaveLength(0);
  });

  it('clears the reference where the rule is set-null', () => {
    const before = db.list('appointments').length;
    db.remove('staff', 'stf-01');
    expect(db.list('appointments')).toHaveLength(before);
    expect(db.list('appointments', (a) => a.staff_id === 'stf-01')).toHaveLength(0);
    expect(db.get('appointments', 'apt-04')?.staff_id).toBeNull();
  });

  it('removes by condition', () => {
    db.removeWhere('dental_records', (r) => r.patient_id === 'pat-01');
    expect(db.list('dental_records', (r) => r.patient_id === 'pat-01')).toHaveLength(0);
  });
});
