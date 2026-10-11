import { Bars } from '@/components/ui/charts';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { messageStatus, statusStyle } from '@/constants/status';
import { dateOfTimestamp, formatDateShort, lastDays } from '@/lib/date';
import { formatNumber, fullName } from '@/lib/format';
import type { SmsMessage } from '@/lib/types';

interface SmsReportsTabProps {
  /** The most recent messages, newest first. */
  messages: SmsMessage[];
}

/** Messages sent on each of the last 7 days. */
function weeklyCounts(messages: SmsMessage[]) {
  return lastDays(7).map(({ iso, dayName }) => {
    const count = messages.filter((m) => dateOfTimestamp(m.sent_at || m.created_at) === iso).length;
    return { label: dayName, value: count };
  });
}

export function SmsReportsTab({ messages }: SmsReportsTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <div className="card p-5">
        <SectionHeader title="آمار ارسال هفته" note="۷ روز اخیر" />
        <Bars data={weeklyCounts(messages)} height={220} format={(v) => `${formatNumber(v)} پیامک`} />
      </div>

      <div className="card p-5">
        <SectionHeader title="آخرین پیامک‌ها" note={`${formatNumber(messages.length)} پیام`} />
        {messages.length === 0 ? (
          <p className="text-sm text-surface-400 text-center py-6">هنوز پیامی ارسال نشده است</p>
        ) : (
          <div className="space-y-2">
            {messages.slice(0, 20).map((msg) => {
              const sc = statusStyle(messageStatus, msg.status, 'pending');
              return (
                <div key={msg.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">{msg.patient ? fullName(msg.patient) : msg.phone_number}</p>
                    <p className="text-xs text-surface-500 truncate">{msg.message_body}</p>
                  </div>
                  <div className="text-left shrink-0">
                    <StatusBadge status={sc} showIcon />
                    <p className="text-[10px] text-surface-400 mt-1">{formatDateShort(msg.sent_at || msg.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
