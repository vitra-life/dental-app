import { TrendingUp } from 'lucide-react';
import { BarChart } from '@/components/ui/bar-chart';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { messageStatus, statusStyle } from '@/constants/status';
import { dateOfTimestamp, formatDateShort, lastDays } from '@/lib/date';
import { formatNumber } from '@/lib/format';
import type { SmsMessage } from '@/lib/types';

interface SmsReportsTabProps {
  /** The most recent messages, newest first. */
  messages: SmsMessage[];
}

/** Messages sent on each of the last 7 days. */
function weeklyCounts(messages: SmsMessage[]) {
  return lastDays(7).map(({ iso, dayName }) => {
    const count = messages.filter((m) => dateOfTimestamp(m.sent_at || m.created_at) === iso).length;
    return { label: dayName, value: count, tooltip: formatNumber(count) };
  });
}

export function SmsReportsTab({ messages }: SmsReportsTabProps) {
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <SectionHeader title="آمار ارسال هفته" subtitle="پیامک‌های ارسالی در ۷ روز اخیر" icon={TrendingUp} tone="primary" />
        <BarChart tone="primary" className="gap-2 h-48" hover={false} bars={weeklyCounts(messages)} />
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-surface-800">آخرین پیامک‌ها</h3>
          <span className="text-xs text-surface-400">{formatNumber(messages.length)} پیام</span>
        </div>
        {messages.length === 0 ? (
          <p className="text-sm text-surface-400 text-center py-6">هنوز پیامی ارسال نشده است</p>
        ) : (
          <div className="space-y-2">
            {messages.slice(0, 20).map((msg) => {
              const sc = statusStyle(messageStatus, msg.status, 'pending');
              const Icon = sc.icon!;
              return (
                <div key={msg.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${sc.bg}`}>
                    <Icon size={16} className={sc.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-700 truncate">{msg.phone_number}</p>
                    <p className="text-xs text-surface-400 truncate">{msg.message_body}</p>
                  </div>
                  <div className="text-left">
                    <StatusBadge status={sc} />
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
