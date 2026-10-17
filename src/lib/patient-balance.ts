import * as db from '@/lib/store';

/**
 * What each patient still owes: the sum of the open balances of their
 * invoices. Invoices live in the browser store while patients come from the
 * API, so the balance is computed when it is shown rather than stored.
 * A negative value is credit.
 */
export function patientBalances(): Map<string, number> {
  const balances = new Map<string, number>();
  for (const invoice of db.list('invoices')) {
    balances.set(invoice.patient_id, (balances.get(invoice.patient_id) ?? 0) + invoice.balance);
  }
  return balances;
}

export function patientBalance(patientId: string): number {
  return patientBalances().get(patientId) ?? 0;
}
