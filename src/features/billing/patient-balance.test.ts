import { beforeEach, describe, expect, it } from 'vitest';
import * as db from '@/lib/store';
import { syncPatientBalance } from './patient-balance';

beforeEach(() => {
  db.resetStore();
});

describe('syncPatientBalance', () => {
  it('sums what the patient owes across all their invoices', () => {
    // pat-02 has a part-paid crown invoice (8,000,000 owed) and a fully paid visit.
    db.insert('invoices', { patient_id: 'pat-02', total: 500_000, balance: 500_000 });
    syncPatientBalance('pat-02');
    expect(db.get('patients', 'pat-02')?.balance).toBe(8_500_000);
  });

  it('drops to zero once every invoice is settled', () => {
    db.updateWhere('invoices', (i) => i.patient_id === 'pat-02', { balance: 0 });
    syncPatientBalance('pat-02');
    expect(db.get('patients', 'pat-02')?.balance).toBe(0);
  });
});
