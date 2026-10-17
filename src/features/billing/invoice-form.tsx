import { useMemo, useState } from 'react';
import { Link2, X } from 'lucide-react';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { Modal } from '@/components/ui/modal';
import { NumberInput } from '@/components/ui/number-input';
import { jalaliMonthsFromToday } from '@/lib/date';
import { formatCurrency, formatNumber } from '@/lib/format';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import { activePlans, billableItems, planItemLabel } from '@/lib/treatment-plans';
import type { Patient, Service } from '@/lib/types';

const installmentOptions = [2, 3, 4, 6, 12].map((n) => ({ value: n, label: `${formatNumber(n)} قسط` }));

/** A short invoice number from the current time, e.g. `INV-482913`. */
const newInvoiceNumber = () => `INV-${Date.now().toString().slice(-6)}`;

export function InvoiceForm({ patients, services, onClose, onSaved }: {
  patients: Patient[];
  services: Service[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [patientId, setPatientId] = useState('');
  const [planId, setPlanId] = useState('');
  /** Quantity and price are `null` while their field is empty; they then count as 1 and 0. */
  const [items, setItems] = useState<{ service_id: string; description: string; quantity: number | null; unit_price: number | null }[]>([]);
  const [discountInput, setDiscount] = useState<number | null>(null);
  const discount = discountInput ?? 0;
  const [paymentType, setPaymentType] = useState<'full' | 'installment'>('full');
  const [installmentCount, setInstallmentCount] = useState(3);
  const [saving, setSaving] = useState(false);

  const plans = useMemo(() => (patientId ? activePlans(patientId, services) : []), [patientId, services]);

  /** Replaces the invoice lines with the plan's work that is done or under way. */
  function loadFromPlan() {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    const lines = billableItems(plan).map((item) => ({
      service_id: item.service_id ?? '',
      description: `${planItemLabel(item)}${item.tooth_number ? ` (دندان ${item.tooth_number})` : ''}`,
      quantity: 1,
      unit_price: item.actual_cost || item.estimated_cost,
    }));
    if (lines.length === 0) { showToast('این طرح هنوز خدمت انجام‌شده‌ای ندارد', 'info'); return; }
    setItems(lines);
  }

  const lineTotal = (item: (typeof items)[number]) => (item.unit_price ?? 0) * (item.quantity ?? 1);
  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const total = Math.max(0, subtotal - discount);

  function addItem() {
    setItems([...items, { service_id: '', description: '', quantity: 1, unit_price: 0 }]);
  }

  function updateItem(index: number, field: 'quantity' | 'unit_price', value: number | null) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  }

  function selectService(index: number, serviceId: string) {
    const svc = services.find((s) => s.id === serviceId);
    if (svc) {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], service_id: serviceId, description: svc.name, unit_price: svc.default_price };
      setItems(newItems);
    }
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function handleSave() {
    if (!patientId) { showToast('بیمار را انتخاب کنید', 'error'); return; }
    if (items.length === 0) { showToast('حداقل یک خدمت اضافه کنید', 'error'); return; }
    setSaving(true);

    const invoiceNumber = newInvoiceNumber();
    const invoice = db.insert('invoices', {
      patient_id: patientId,
      treatment_plan_id: planId || null,
      invoice_number: invoiceNumber,
      subtotal,
      discount,
      total,
      paid_amount: 0,
      balance: total,
      status: 'unpaid',
      payment_type: paymentType === 'installment' ? 'installment' : 'full',
      installment_count: paymentType === 'installment' ? installmentCount : 0,
    });

    const itemInserts = items.map((item) => ({
      invoice_id: invoice.id,
      service_id: item.service_id || null,
      description: item.description,
      quantity: item.quantity ?? 1,
      unit_price: item.unit_price ?? 0,
      total: lineTotal(item),
    }));
    db.insertMany('invoice_items', itemInserts);

    if (paymentType === 'installment' && installmentCount > 0) {
      const installmentAmount = Math.round(total / installmentCount);
      const installments: db.Insert<'installments'>[] = [];
      for (let i = 0; i < installmentCount; i++) {
        installments.push({
          invoice_id: invoice.id,
          installment_number: i + 1,
          amount: i === installmentCount - 1 ? total - installmentAmount * (installmentCount - 1) : installmentAmount,
          due_date: jalaliMonthsFromToday(i + 1),
          paid: false,
        });
      }
      db.insertMany('installments', installments);
    }

    showToast('صورتحساب ایجاد شد');
    setSaving(false);
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="صدور فاکتور جدید" size="lg">
      <div className="space-y-4">
        <div>
          <label className="label-field">بیمار *</label>
          <select className="input-field" value={patientId} onChange={(e) => { setPatientId(e.target.value); setPlanId(''); }}>
            <option value="">انتخاب بیمار</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} - {p.phone}</option>)}
          </select>
        </div>

        {plans.length > 0 && (
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-3">
            <label className="flex items-center gap-1.5 text-xs font-medium text-primary-700 mb-1">
              <Link2 size={13} />
              اتصال به طرح درمان
            </label>
            <div className="flex gap-2">
              <select className="input-field border-primary-200 rounded-lg flex-1 min-w-0" value={planId} onChange={(e) => setPlanId(e.target.value)}>
                <option value="">بدون طرح درمان</option>
                {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}
              </select>
              {planId && (
                <button type="button" onClick={loadFromPlan} className="btn-primary text-xs px-3 rounded-lg whitespace-nowrap">بارگذاری خدمات</button>
              )}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-surface-600">خدمات</label>
            <button onClick={addItem} className="text-xs text-primary-600 font-medium hover:text-primary-700">+ افزودن</button>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  className="input-field flex-1 min-w-0"
                  value={item.service_id}
                  onChange={(e) => selectService(i, e.target.value)}
                >
                  <option value="">{item.description || 'انتخاب خدمت'}</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <NumberInput className="input-field w-16" value={item.quantity} onChange={(v) => updateItem(i, 'quantity', v)} placeholder="تعداد" />
                <NumberInput className="input-field w-28" value={item.unit_price} onChange={(v) => updateItem(i, 'unit_price', v)} placeholder="قیمت" />
                <button onClick={() => removeItem(i)} title="حذف" className="p-2 rounded-lg text-error-400 hover:bg-error-50 hover:text-error-600 shrink-0">
                  <X size={16} />
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-sm text-surface-400 text-center py-4">هیچ خدمتی اضافه نشده</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">تخفیف (تومان)</label>
            <NumberInput value={discountInput} onChange={setDiscount} placeholder="0" />
          </div>
          <div>
            <label className="label-field">نوع پرداخت</label>
            <select className="input-field" value={paymentType} onChange={(e) => setPaymentType(e.target.value as 'full' | 'installment')}>
              <option value="full">پرداخت کامل</option>
              <option value="installment">اقساطی</option>
            </select>
          </div>
        </div>

        {paymentType === 'installment' && (
          <div>
            <label className="label-field">تعداد اقساط</label>
            <ChoiceChips options={installmentOptions} value={installmentCount} onChange={setInstallmentCount} />
            <p className="text-xs text-surface-400 mt-2">مبلغ هر قسط: {formatCurrency(Math.round(total / installmentCount))}</p>
          </div>
        )}

        <div className="p-4 bg-surface-50 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-surface-500">جمع کل:</span>
            <span className="font-medium text-surface-700">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-surface-500">تخفیف:</span>
            <span className="font-medium text-error-600">- {formatCurrency(discount)}</span>
          </div>
          <div className="flex items-center justify-between text-base font-bold pt-2 border-t border-surface-200">
            <span className="text-surface-700">مبلغ قابل پرداخت:</span>
            <span className="text-primary-700">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'در حال ثبت...' : 'صدور فاکتور'}
          </button>
          <button onClick={onClose} className="btn-secondary">انصراف</button>
        </div>
      </div>
    </Modal>
  );
}
