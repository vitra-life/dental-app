import { useState } from 'react';
import { AlertTriangle, Send } from 'lucide-react';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { Modal } from '@/components/ui/modal';
import { formatNumber } from '@/lib/format';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { Patient } from '@/lib/types';

type Target = 'all' | 'active' | 'inactive' | 'debtors' | 'custom';

const targetOptions: { value: Target; label: string }[] = [
  { value: 'all', label: 'همه بیماران' },
  { value: 'active', label: 'بیماران فعال' },
  { value: 'inactive', label: 'غیرفعال' },
  { value: 'debtors', label: 'بدهکار' },
];

/** One SMS holds 70 Persian characters; longer texts are billed as several. */
const SMS_LENGTH = 70;

export function CampaignForm({ patients, remainingCredits, onClose, onSaved }: {
  patients: Patient[];
  remainingCredits: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<Target>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  const targetPatients = patients.filter((p) => {
    if (target === 'all') return true;
    if (target === 'active') return p.status === 'active';
    if (target === 'inactive') return p.status !== 'active';
    if (target === 'debtors') return p.balance > 0;
    return true;
  });

  const recipientCount = target === 'custom' ? selectedIds.size : targetPatients.length;
  const messageLength = message.length;
  const smsCount = Math.ceil(messageLength / SMS_LENGTH) || 1;
  const totalNeeded = recipientCount * smsCount;

  function handleSend() {
    if (!title.trim() || !message.trim()) { showToast('عنوان و متن پیام الزامی است', 'error'); return; }
    if (recipientCount === 0) { showToast('گیرنده‌ای انتخاب نشده است', 'error'); return; }
    if (totalNeeded > remainingCredits) { showToast(`موجودی کافی نیست. ${formatNumber(totalNeeded)} پیامک نیاز است`, 'error'); return; }

    setSending(true);

    const recipients = target === 'custom'
      ? patients.filter((p) => selectedIds.has(p.id))
      : targetPatients;

    const campaign = db.insert('sms_campaigns', {
      title: title.trim(),
      message_body: message.trim(),
      target_filter: { type: target },
      total_recipients: recipients.length,
      sent_count: 0,
      failed_count: 0,
      pending_count: recipients.length,
      status: 'sending',
    });

    const msgInserts = recipients.map((p) => ({
      campaign_id: campaign.id,
      patient_id: p.id,
      phone_number: p.phone,
      message_body: message.trim(),
      status: 'sent' as const,
      sent_at: new Date().toISOString(),
    }));

    db.insertMany('sms_messages', msgInserts);

    db.update('sms_campaigns', campaign.id, {
      status: 'completed',
      sent_count: recipients.length,
      pending_count: 0,
      sent_at: new Date().toISOString(),
    });

    const activePkg = db.orderBy(db.list('sms_packages', (p) => p.status === 'active'), 'created_at')[0];
    if (activePkg) {
      const newUsed = activePkg.used_credits + totalNeeded;
      const newRemaining = Math.max(0, activePkg.remaining_credits - totalNeeded);
      db.update('sms_packages', activePkg.id, {
        used_credits: newUsed,
        remaining_credits: newRemaining,
        status: newRemaining <= 0 ? 'expired' : 'active',
      });
    }

    showToast(`${formatNumber(recipients.length)} پیامک ارسال شد`);
    setSending(false);
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="کمپین پیامک جدید" size="lg">
      <div className="space-y-4">
        <div>
          <label className="label-field">عنوان کمپین *</label>
          <input className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلا: یادآوری چکاپ دوره‌ای" />
        </div>
        <div>
          <label className="label-field">متن پیام *</label>
          <textarea className="input-field min-h-[100px]" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="متن پیامک خود را وارد کنید..." />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-surface-400">{formatNumber(messageLength)} کاراکتر</span>
            <span className="text-xs text-surface-400">{formatNumber(smsCount)} پیامک برای هر گیرنده</span>
          </div>
        </div>
        <div>
          <label className="label-field">گروه هدف</label>
          <ChoiceChips options={targetOptions} value={target} onChange={setTarget} className="grid grid-cols-2 md:grid-cols-4 gap-2" chipClassName="px-3 py-2" />
        </div>

        {target === 'custom' && (
          <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-surface-50 rounded-xl">
            {patients.map((p) => (
              <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.has(p.id)}
                  onChange={(e) => {
                    const next = new Set(selectedIds);
                    if (e.target.checked) next.add(p.id);
                    else next.delete(p.id);
                    setSelectedIds(next);
                  }}
                  className="w-4 h-4 accent-primary-500"
                />
                <span className="text-sm text-surface-700">{p.first_name} {p.last_name} - {p.phone}</span>
              </label>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="p-4 bg-primary-50 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-surface-600">تعداد گیرندگان</span>
            <span className="font-bold text-surface-800">{formatNumber(recipientCount)} نفر</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-surface-600">کل پیامک‌های مورد نیاز</span>
            <span className="font-bold text-surface-800">{formatNumber(totalNeeded)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-surface-600">موجودی فعلی</span>
            <span className={`font-bold ${totalNeeded > remainingCredits ? 'text-error-600' : 'text-accent-600'}`}>{formatNumber(remainingCredits)}</span>
          </div>
          {totalNeeded > remainingCredits && (
            <div className="flex items-center gap-2 text-xs text-error-600 mt-2">
              <AlertTriangle size={14} />
              موجودی کافی نیست. لطفاً بسته پیامک خریداری کنید.
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleSend} disabled={sending || totalNeeded > remainingCredits} className="btn-primary flex-1">
            <Send size={18} />
            {sending ? 'در حال ارسال...' : `ارسال به ${formatNumber(recipientCount)} نفر`}
          </button>
          <button onClick={onClose} className="btn-secondary">انصراف</button>
        </div>
      </div>
    </Modal>
  );
}
