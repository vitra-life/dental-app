import { beforeEach, describe, expect, it } from 'vitest';
import { pat } from '@/constants/seed/ids';
import * as db from '@/lib/store';
import { patientBalance, patientBalances } from './patient-balance';

beforeEach(() => {
  db.resetStore();
});

describe('patientBalance', () => {
  it('sums what the patient owes across all their invoices', () => {
    // Patient 2 has a part-paid crown invoice (8,000,000 owed) and a fully paid visit.
    expect(patientBalance(pat(2))).toBe(8_000_000);
    db.insert('invoices', { patient_id: pat(2), total: 500_000, balance: 500_000 });
    expect(patientBalance(pat(2))).toBe(8_500_000);
  });

  it('drops to zero once every invoice is settled', () => {
    db.updateWhere('invoices', (i) => i.patient_id === pat(2), { balance: 0 });
    expect(patientBalance(pat(2))).toBe(0);
  });

  it('is zero for a patient without invoices', () => {
    expect(patientBalance('someone-else')).toBe(0);
    expect(patientBalances().has('someone-else')).toBe(false);
  });
});
