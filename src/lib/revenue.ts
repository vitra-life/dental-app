import { currentJalaliMonth, isInJalaliMonth, jalaliMonthName, shiftJalaliMonth } from '@/lib/date';
import type { Invoice } from '@/lib/types';

type Billed = Pick<Invoice, 'total' | 'created_at'>;

function billedIn(invoices: Billed[], monthsAgo: number): number {
  const month = shiftJalaliMonth(currentJalaliMonth(), -monthsAgo);
  return invoices.filter((i) => isInJalaliMonth(i.created_at, month)).reduce((sum, i) => sum + (i.total || 0), 0);
}

/** Invoiced totals for this Jalali month and the last, and the change between them in percent. */
export function monthOverMonth(invoices: Billed[]): { thisMonth: number; lastMonth: number; change: number } {
  const thisMonth = billedIn(invoices, 0);
  const lastMonth = billedIn(invoices, 1);
  const change = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;
  return { thisMonth, lastMonth, change };
}

/** Invoiced totals for the last `months` Jalali months, oldest first. */
export function revenueByMonth(invoices: Billed[], months: number): { month: string; amount: number }[] {
  return Array.from({ length: months }, (_, i) => {
    const monthsAgo = months - 1 - i;
    return {
      month: jalaliMonthName(shiftJalaliMonth(currentJalaliMonth(), -monthsAgo)),
      amount: billedIn(invoices, monthsAgo),
    };
  });
}
