import type { SmsCampaign, SmsMessage, SmsPackage } from '@/lib/types';
import { patients } from './patients';
import { daysFromToday, timestampFromNow } from '@/lib/date';

export const smsPackages: SmsPackage[] = [
  { id: 'smp-01', package_name: 'بسته آزمایشی', total_credits: 1000, used_credits: 1000, remaining_credits: 0, purchase_date: daysFromToday(-200), expiry_date: null, price: 0, status: 'expired', created_at: timestampFromNow(-200) },
  { id: 'smp-02', package_name: 'بسته متوسط (۱٬۰۰۰ پیامک)', total_credits: 1000, used_credits: 14, remaining_credits: 986, purchase_date: daysFromToday(-30), expiry_date: daysFromToday(335), price: 130_000, status: 'active', created_at: timestampFromNow(-30) },
];

const nowruzBody = 'بیمار گرامی، نوروز مبارک! کلینیک دندانپزشکی لبخند سال خوبی را برای شما آرزو می‌کند.';
const checkupBody = 'بیمار گرامی، بیش از ۶ ماه از آخرین معاینه شما گذشته است. برای رزرو نوبت چکاپ با ۰۲۱-۸۸۷۷۶۶۵۵ تماس بگیرید.';

export const smsCampaigns: SmsCampaign[] = [
  { id: 'smc-01', title: 'تبریک نوروز', message_body: nowruzBody, target_filter: { type: 'all' }, total_recipients: 12, sent_count: 12, failed_count: 0, pending_count: 0, status: 'completed', scheduled_at: null, sent_at: timestampFromNow(-25), created_at: timestampFromNow(-25) },
  { id: 'smc-02', title: 'یادآوری چکاپ', message_body: checkupBody, target_filter: { type: 'inactive' }, total_recipients: 1, sent_count: 1, failed_count: 0, pending_count: 0, status: 'completed', scheduled_at: null, sent_at: timestampFromNow(-7), created_at: timestampFromNow(-7) },
  { id: 'smc-03', title: 'تخفیف بلیچینگ', message_body: 'تا پایان ماه، ۲۰٪ تخفیف ویژه بلیچینگ در کلینیک لبخند.', target_filter: { type: 'active' }, total_recipients: 0, sent_count: 0, failed_count: 0, pending_count: 0, status: 'draft', scheduled_at: null, sent_at: null, created_at: timestampFromNow(-2) },
];

export const smsMessages: SmsMessage[] = [
  ...patients.map((p, i): SmsMessage => ({
    id: `sms-${String(i + 1).padStart(2, '0')}`,
    campaign_id: 'smc-01',
    patient_id: p.id,
    phone_number: p.phone,
    message_body: nowruzBody,
    status: 'sent',
    sent_at: timestampFromNow(-25),
    error_message: null,
    created_at: timestampFromNow(-25),
  })),
  {
    id: 'sms-13',
    campaign_id: 'smc-02',
    patient_id: 'pat-11',
    phone_number: '09121110011',
    message_body: checkupBody,
    status: 'sent',
    sent_at: timestampFromNow(-7),
    error_message: null,
    created_at: timestampFromNow(-7),
  },
];
