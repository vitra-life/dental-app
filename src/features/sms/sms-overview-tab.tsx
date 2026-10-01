import { CheckCircle2, Clock, Package, Send, XCircle, Zap } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { MiniStat } from '@/components/ui/stat-tile';
import { StatusBadge } from '@/components/ui/status-badge';
import { campaignStatus, statusStyle } from '@/constants/status';
import { formatDate } from '@/lib/date';
import { formatNumber } from '@/lib/format';
import type { SmsCampaign, SmsPackage } from '@/lib/types';

interface SmsOverviewTabProps {
  packages: SmsPackage[];
  campaigns: SmsCampaign[];
  onShowAllCampaigns: () => void;
}

const sum = <T,>(items: T[], pick: (item: T) => number) => items.reduce((total, item) => total + pick(item), 0);

// Circumference of the credit ring (r = 52 in a 120×120 viewBox).
const RING = 2 * Math.PI * 52;

export function SmsOverviewTab({ packages, campaigns, onShowAllCampaigns }: SmsOverviewTabProps) {
  const totalCredits = sum(packages, (p) => p.total_credits);
  const usedCredits = sum(packages, (p) => p.used_credits);
  const remainingCredits = sum(packages, (p) => p.remaining_credits);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat label="بسته‌های فعال" icon={Package} tone="primary">
          {formatNumber(packages.filter((p) => p.status === 'active').length)}
        </MiniStat>
        <MiniStat label="پیامک‌های ارسال شده" icon={CheckCircle2} tone="accent" delay={50}>
          {formatNumber(sum(campaigns, (c) => c.sent_count))}
        </MiniStat>
        <MiniStat label="ناموفق" icon={XCircle} tone="error" delay={100}>
          {formatNumber(sum(campaigns, (c) => c.failed_count))}
        </MiniStat>
        <MiniStat label="در انتظار" icon={Clock} tone="warning" delay={150}>
          {formatNumber(sum(campaigns, (c) => c.pending_count))}
        </MiniStat>
      </div>

      {/* Remaining credits */}
      <div className="card p-6">
        <SectionHeader title="باقی‌مانده پیامک" subtitle="موجودی فعلی بسته‌های پیامک" icon={Zap} tone="primary" />

        <div className="flex flex-col items-center py-6">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="url(#smsGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${RING}`}
                strokeDashoffset={`${RING * (1 - (totalCredits > 0 ? remainingCredits / totalCredits : 0))}`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="smsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-surface-800">{formatNumber(remainingCredits)}</span>
              <span className="text-xs text-surface-400 mt-1">از {formatNumber(totalCredits)} پیامک</span>
            </div>
          </div>
          <div className="flex items-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent-500" />
              <span className="text-xs text-surface-500">استفاده شده: {formatNumber(usedCredits)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary-500" />
              <span className="text-xs text-surface-500">باقی‌مانده: {formatNumber(remainingCredits)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent campaigns */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-surface-800">آخرین کمپین‌ها</h3>
          <button onClick={onShowAllCampaigns} className="text-sm text-primary-600 font-medium">مشاهده همه</button>
        </div>
        {campaigns.length === 0 ? (
          <p className="text-sm text-surface-400 text-center py-6">هنوز کمپینی ایجاد نشده است</p>
        ) : (
          <div className="space-y-2">
            {campaigns.slice(0, 5).map((c) => {
              const sc = statusStyle(campaignStatus, c.status, 'draft');
              return (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${sc.bg}`}>
                    <Send size={16} className={sc.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-700 truncate">{c.title}</p>
                    <p className="text-xs text-surface-400">{formatDate(c.created_at)}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-surface-500">{formatNumber(c.sent_count)}/{formatNumber(c.total_recipients)} ارسال</p>
                    <StatusBadge status={sc} />
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
