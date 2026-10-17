import { beforeEach, describe, expect, it } from 'vitest';
import { pat } from '@/constants/seed/ids';
import * as db from './store';

beforeEach(() => {
  db.resetStore();
});

describe('reads', () => {
  it('returns copies, so callers cannot change stored rows', () => {
    const [first] = db.list('labs');
    first.name = 'changed';
    expect(db.get('labs', first.id)?.name).not.toBe('changed');
  });

  it('filters, finds and sorts', () => {
    expect(db.list('staff', (s) => s.role === 'dentist')).toHaveLength(3);
    expect(db.get('labs', 'missing')).toBeNull();
    expect(db.first('clinic_settings')?.id).toBe('clinic-01');
    const ids = db.orderBy(db.list('invoices'), 'total', { ascending: false }).map((i) => i.id);
    expect(ids[0]).toBe('inv-04');
  });

  it('attaches related rows', () => {
    const [order] = db.withOne(db.list('lab_orders', (o) => o.id === 'lo-02'), 'lab', 'labs', 'lab_id');
    expect(order.lab?.id).toBe('lab-02');
    const [plan] = db.withMany(db.list('treatment_plans', (p) => p.id === 'tp-01'), 'items', 'treatment_plan_items', 'plan_id');
    expect(plan.items).toHaveLength(3);
  });

  it('attaches rows from outside the store, such as patients from the API', () => {
    const patients = [{ id: pat(6), first_name: 'مریم' }];
    const [invoice] = db.joinOne(db.list('invoices', (i) => i.id === 'inv-04'), 'patient', patients, 'patient_id');
    expect(invoice.patient?.first_name).toBe('مریم');
    const [other] = db.joinOne(db.list('invoices', (i) => i.id === 'inv-01'), 'patient', patients, 'patient_id');
    expect(other.patient).toBeUndefined();
  });
});

describe('writes', () => {
  it('fills defaults, an id and created_at on insert', () => {
    const lab = db.insert('labs', { name: 'لابراتوار تست' });
    expect(lab.id).toBeTruthy();
    expect(lab.created_at).toBeTruthy();
    expect(lab.balance).toBe(0);
    expect(lab.active).toBe(true);
    expect(db.get('labs', lab.id)).toEqual(lab);
  });

  it('updates one row and leaves the rest', () => {
    db.update('labs', 'lab-01', { phone: '000' });
    expect(db.get('labs', 'lab-01')?.phone).toBe('000');
    expect(db.get('labs', 'lab-02')?.phone).not.toBe('000');
    expect(db.update('labs', 'missing', { phone: '1' })).toBeNull();
  });

  it('persists to localStorage and restores the sample data on reset', () => {
    const original = db.get('labs', 'lab-01')?.phone;
    db.update('labs', 'lab-01', { phone: '000' });
    expect(localStorage.getItem('dentaclinic:data:v2')).toContain('"phone":"000"');
    db.resetStore();
    expect(localStorage.getItem('dentaclinic:data:v2')).toBeNull();
    expect(db.get('labs', 'lab-01')?.phone).toBe(original);
  });
});

describe('deletes follow the foreign keys', () => {
  it('cascades from an invoice to everything it owns', () => {
    db.remove('invoices', 'inv-04');
    expect(db.list('installments', (i) => i.invoice_id === 'inv-04')).toHaveLength(0);
    expect(db.list('invoice_items', (i) => i.invoice_id === 'inv-04')).toHaveLength(0);
    expect(db.list('payments', (p) => p.invoice_id === 'inv-04')).toHaveLength(0);
  });

  it('cascades from a lab to its services and orders', () => {
    db.remove('labs', 'lab-01');
    expect(db.list('lab_orders', (o) => o.lab_id === 'lab-01')).toHaveLength(0);
    expect(db.list('lab_services', (s) => s.lab_id === 'lab-01')).toHaveLength(0);
  });

  it('clears the reference where the rule is set-null', () => {
    const before = db.list('lab_orders').length;
    db.remove('staff', 'stf-01');
    expect(db.list('lab_orders')).toHaveLength(before);
    expect(db.list('lab_orders', (o) => o.staff_id === 'stf-01')).toHaveLength(0);
    expect(db.get('lab_orders', 'lo-01')?.staff_id).toBeNull();
  });

  it('removes by condition', () => {
    db.removeWhere('dental_records', (r) => r.patient_id === pat(1));
    expect(db.list('dental_records', (r) => r.patient_id === pat(1))).toHaveLength(0);
  });
});
