import { CheckCircle2, Clock, Plus, Send, XCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { StatusBadge } from '@/components/ui/status-badge';
import { campaignStatus, statusStyle } from '@/constants/status';
import { formatDate } from '@/lib/date';
import { formatNumber, percent } from '@/lib/format';
import type { SmsCampaign } from '@/lib/types';

interface SmsCampaignsTabProps {
  campaigns: SmsCampaign[];
  onNew: () => void;
  onOpen: (campaign: SmsCampaign) => void;
}

export function SmsCampaignsTab({ campaigns, onNew, onOpen }: SmsCampaignsTabProps) {
  return (
    <div className="space-y-4">
      {campaigns.length === 0 ? (
        <EmptyState
          icon={Send}
          title="هیچ کمپینی وجود ندارد"
          description="اولین کمپین پیامک خود را ایجاد کنید"
          action={<button onClick={onNew} className="btn-primary"><Plus size={16} />کمپین جدید</button>}
        />
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const progress = percent(c.sent_count, c.total_recipients);
            return (
              <div
                key={c.id}
                className="card card-hover p-5 cursor-pointer"
                onClick={() => onOpen(c)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-surface-800">{c.title}</h3>
                    <p className="text-xs text-surface-400 mt-0.5">{formatDate(c.created_at)}</p>
                  </div>
                  <StatusBadge status={statusStyle(campaignStatus, c.status, 'draft')} />
                </div>
                <p className="text-xs text-surface-600 bg-surface-50 rounded-lg p-3 mb-3 line-clamp-2">{c.message_body}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar value={progress} />
                  </div>
                  <span className="text-xs text-surface-500">{formatNumber(c.sent_count)}/{formatNumber(c.total_recipients)}</span>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1 text-xs text-accent-600">
                    <CheckCircle2 size={12} />
                    {formatNumber(c.sent_count)} موفق
                  </span>
                  {c.failed_count > 0 && (
                    <span className="flex items-center gap-1 text-xs text-error-600">
                      <XCircle size={12} />
                      {formatNumber(c.failed_count)} ناموفق
                    </span>
                  )}
                  {c.pending_count > 0 && (
                    <span className="flex items-center gap-1 text-xs text-warning-600">
                      <Clock size={12} />
                      {formatNumber(c.pending_count)} در انتظار
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
