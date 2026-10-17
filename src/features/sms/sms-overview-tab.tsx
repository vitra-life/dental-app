import { CheckCircle2, Clock, Package, XCircle } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { StatTile } from '@/components/ui/stat-tile';
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
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="بسته‌های فعال" value={formatNumber(packages.filter((p) => p.status === 'active').length)} icon={Package} tone="primary" />
        <StatTile label="پیامک‌های ارسال شده" value={formatNumber(sum(campaigns, (c) => c.sent_count))} icon={CheckCircle2} tone="accent" />
        <StatTile label="ناموفق" value={formatNumber(sum(campaigns, (c) => c.failed_count))} icon={XCircle} tone="error" />
        <StatTile label="در انتظار" value={formatNumber(sum(campaigns, (c) => c.pending_count))} icon={Clock} tone="warning" />
      </div>

      {/* Remaining credits */}
      <div className="card p-5 lg:col-span-2">
        <SectionHeader title="باقی‌مانده پیامک" note="موجودی بسته‌ها" />

        <div className="flex flex-col items-center py-4">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="10" />
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
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-surface-800">{formatNumber(remainingCredits)}</span>
              <span className="text-xs text-surface-400 mt-1">از {formatNumber(totalCredits)} پیامک</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-1 mt-5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-surface-200" />
              <span className="text-xs text-surface-500">استفاده شده: {formatNumber(usedCredits)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
              <span className="text-xs text-surface-500">باقی‌مانده: {formatNumber(remainingCredits)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent campaigns */}
      <div className="card p-5 lg:col-span-3">
        <SectionHeader title="آخرین کمپین‌ها" aside={<button onClick={onShowAllCampaigns} className="text-xs text-primary-600 hover:text-primary-700 font-medium">مشاهده همه</button>} />
        {campaigns.length === 0 ? (
          <p className="text-sm text-surface-400 text-center py-6">هنوز کمپینی ایجاد نشده است</p>
        ) : (
          <div className="space-y-2">
            {campaigns.slice(0, 5).map((c) => {
              const sc = statusStyle(campaignStatus, c.status, 'draft');
              return (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">{c.title}</p>
                    <p className="text-xs text-surface-500">{formatDate(c.created_at)} · {formatNumber(c.sent_count)}/{formatNumber(c.total_recipients)} ارسال</p>
                  </div>
                  <StatusBadge status={sc} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
