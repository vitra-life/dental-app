import { daysFromToday } from '@/lib/date';
import { formatNumber } from '@/lib/format';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';

export interface SmsPackageOffer {
  credits: number;
  price: number;
  label: string;
}

/** The credit bundles a clinic can buy. */
export const SMS_PACKAGE_OFFERS: SmsPackageOffer[] = [
  { credits: 500, price: 75000, label: 'کوچک' },
  { credits: 1000, price: 130000, label: 'متوسط' },
  { credits: 5000, price: 550000, label: 'بزرگ' },
  { credits: 10000, price: 950000, label: 'سازمانی' },
];

/** Adds a purchased bundle, valid for one year. */
export function buyPackage(offer: SmsPackageOffer) {
  db.insert('sms_packages', {
    package_name: `بسته ${offer.label} (${formatNumber(offer.credits)} پیامک)`,
    total_credits: offer.credits,
    used_credits: 0,
    remaining_credits: offer.credits,
    price: offer.price,
    status: 'active',
    expiry_date: daysFromToday(365),
  });
  showToast(`بسته ${offer.label} خریداری شد`);
}
