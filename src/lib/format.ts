// Display helpers for numbers, money, times and names. Date formatting lives in `@/lib/date`.

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(amount)) + ' تومان';
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('fa-IR').format(n);
}

/** `14:30` or `14:30:00` → `2:30 بعدازظهر`. */
export function formatTime(time: string): string {
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const period = hour < 12 ? 'صبح' : 'بعدازظهر';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m} ${period}`;
}

/** `14:30:00` → `14:30`: the 24-hour clock, for tight spots where the AM/PM suffix doesn't fit. */
export function formatClock(time: string): string {
  return time.slice(0, 5);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`;
}

/** "First Last", or `fallback` when the person is missing. */
export function fullName(
  person: { first_name: string; last_name: string } | null | undefined,
  fallback = 'نامشخص',
): string {
  return person ? `${person.first_name} ${person.last_name}` : fallback;
}

/** `part` as a whole percentage of `total`; 0 when `total` is 0. */
export function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'نقدی',
  card: 'کارت',
  online: 'آنلاین',
  transfer: 'انتقال',
};

export function paymentMethodLabel(method: string): string {
  return paymentMethodLabels[method] || method;
}
