import { useState } from 'react';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { Modal } from '@/components/ui/modal';
import { NumberInput } from '@/components/ui/number-input';
import { todayISO } from '@/lib/date';
import { formatCurrency, paymentMethodLabel } from '@/lib/format';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { Lab } from '@/lib/types';

const paymentMethods = (['cash', 'card', 'transfer'] as const).map((m) => ({ value: m, label: paymentMethodLabel(m) }));

export function LabPaymentForm({ lab, onClose, onSaved }: { lab: Lab; onClose: () => void; onSaved: () => void }) {
  const [amountInput, setAmountInput] = useState<number | null>(null);
  const [method, setMethod] = useState<(typeof paymentMethods)[number]['value']>('cash');
  const [saving, setSaving] = useState(false);

  function save() {
    const amount = amountInput ?? 0;
    if (amount <= 0) { showToast('مبلغ را وارد کنید', 'error'); return; }
    setSaving(true);
    db.insert('lab_payments', {
      lab_id: lab.id,
      amount,
      payment_method: method,
      payment_date: todayISO(),
    });
    db.update('labs', lab.id, { balance: Math.max(0, lab.balance - amount) });
    showToast('پرداخت ثبت شد');
    onSaved();
    setSaving(false);
  }

  return (
    <Modal open onClose={onClose} title={`پرداخت به ${lab.name}`} size="sm">
      <div className="space-y-4">
        <div className="p-3 bg-surface-50 rounded-xl">
          <p className="text-xs text-surface-400">بدهی فعلی</p>
          <p className="text-lg font-bold text-error-600">{formatCurrency(lab.balance)}</p>
        </div>
        <div>
          <label className="label-field">مبلغ پرداخت (تومان)</label>
          <NumberInput value={amountInput} onChange={setAmountInput} placeholder="0" />
        </div>
        <div>
          <label className="label-field">روش پرداخت</label>
          <ChoiceChips options={paymentMethods} value={method} onChange={setMethod} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'در حال ثبت...' : 'ثبت پرداخت'}</button>
          <button onClick={onClose} className="btn-secondary">انصراف</button>
        </div>
      </div>
    </Modal>
  );
}
