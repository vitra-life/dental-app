import { describe, expect, it } from 'vitest';
import { formatCurrency, formatNumber, formatTime, fullName, getInitials, paymentMethodLabel, percent } from './format';

describe('format', () => {
  it('formats numbers and money with Persian digits', () => {
    expect(formatNumber(1200)).toBe('۱٬۲۰۰');
    expect(formatCurrency(1_500_000)).toBe('۱٬۵۰۰٬۰۰۰ تومان');
  });

  it('formats times on a 12-hour clock', () => {
    expect(formatTime('09:00')).toBe('9:00 صبح');
    expect(formatTime('14:30:00')).toBe('2:30 بعدازظهر');
    expect(formatTime('00:15')).toBe('12:15 صبح');
  });

  it('builds names with a fallback', () => {
    expect(fullName({ first_name: 'مریم', last_name: 'صادقی' })).toBe('مریم صادقی');
    expect(fullName(undefined)).toBe('نامشخص');
    expect(fullName(null, '0912')).toBe('0912');
    expect(getInitials('مریم', 'صادقی')).toBe('مص');
  });

  it('computes whole percentages', () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(5, 0)).toBe(0);
  });

  it('labels payment methods, passing unknown ones through', () => {
    expect(paymentMethodLabel('cash')).toBe('نقدی');
    expect(paymentMethodLabel('cheque')).toBe('cheque');
  });
});
