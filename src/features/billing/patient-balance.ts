import * as db from '@/lib/store';

/**
 * Recomputes a patient's balance as the sum of what they still owe across all
 * their invoices. Call it after any change to an invoice's `balance`.
 */
export function syncPatientBalance(patientId: string) {
  const owed = db.list('invoices', (i) => i.patient_id === patientId).reduce((sum, i) => sum + i.balance, 0);
  db.update('patients', patientId, { balance: owed });
}
