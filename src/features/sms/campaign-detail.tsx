import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { campaignStatus, messageStatus, statusStyle } from '@/constants/status';
import { formatNumber, fullName } from '@/lib/format';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { SmsCampaign, SmsMessage } from '@/lib/types';

export function CampaignDetail({ campaign, onClose, onUpdated }: {
  campaign: SmsCampaign;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rows = db.orderBy(db.list('sms_messages', (m) => m.campaign_id === campaign.id), 'created_at', { ascending: false });
    setMessages(db.withOne(rows, 'patient', 'patients', 'patient_id'));
    setLoading(false);
  }, [campaign.id]);

  function cancelCampaign() {
    db.update('sms_campaigns', campaign.id, { status: 'cancelled' });
    showToast('کمپین لغو شد');
    onUpdated();
    onClose();
  }

  function deleteCampaign() {
    // Removing the campaign cascades to its messages.
    db.remove('sms_campaigns', campaign.id);
    showToast('کمپین حذف شد');
    onUpdated();
    onClose();
  }


  return (
    <Modal open onClose={onClose} title={campaign.title} size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
          <div>
            <p className="text-xs text-surface-400">وضعیت</p>
            <StatusBadge status={statusStyle(campaignStatus, campaign.status, 'draft')} className="mt-1" />
          </div>
          <div>
            <p className="text-xs text-surface-400">گیرندگان</p>
            <p className="text-sm font-bold text-surface-800 mt-1">{formatNumber(campaign.total_recipients)} نفر</p>
          </div>
          <div>
            <p className="text-xs text-surface-400">ارسال شده</p>
            <p className="text-sm font-bold text-accent-600 mt-1">{formatNumber(campaign.sent_count)}</p>
          </div>
          <div>
            <p className="text-xs text-surface-400">ناموفق</p>
            <p className="text-sm font-bold text-error-600 mt-1">{formatNumber(campaign.failed_count)}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-surface-400 mb-2">متن پیام</p>
          <div className="p-3 bg-surface-50 rounded-xl text-sm text-surface-700">{campaign.message_body}</div>
        </div>

        <div>
          <p className="text-xs text-surface-400 mb-2">لیست گیرندگان</p>
          {loading ? (
            <Skeleton className="h-32" variant="inset" />
          ) : messages.length === 0 ? (
            <p className="text-sm text-surface-400 text-center py-4">پیامی ثبت نشده</p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {messages.map((msg) => {
                const msc = statusStyle(messageStatus, msg.status, 'pending');
                const Icon = msc.icon!;
                return (
                  <div key={msg.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${msc.bg}`}>
                      <Icon size={14} className={msc.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-700">{fullName(msg.patient, msg.phone_number)}</p>
                      <p className="text-xs text-surface-400">{msg.phone_number}</p>
                    </div>
                    <StatusBadge status={msc} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {(campaign.status === 'draft' || campaign.status === 'sending') && (
          <button onClick={cancelCampaign} className="btn-secondary w-full">
            لغو کمپین
          </button>
        )}
        <button onClick={deleteCampaign} className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl text-error-500 hover:bg-error-50 transition-colors text-sm">
          <Trash2 size={16} />
          حذف کمپین
        </button>
      </div>
    </Modal>
  );
}
