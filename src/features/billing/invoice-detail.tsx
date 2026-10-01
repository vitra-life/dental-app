import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Clock, DollarSign, Wallet } from 'lucide-react';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { JalaliDateInput } from '@/components/ui/jalali-date-input';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { invoiceStatus, statusStyle } from '@/constants/status';
import { formatDate, isPast, todayISO } from '@/lib/date';
import { formatCurrency, formatNumber, paymentMethodLabel } from '@/lib/format';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { Installment, Invoice, InvoiceItem, Payment } from '@/lib/types';
import { syncPatientBalance } from './patient-balance';

const paymentMethods = (['cash', 'card', 'online', 'transfer'] as const).map((m) => ({ value: m, label: paymentMethodLabel(m) }));

export function InvoiceDetail({ invoice, onClose, onUpdated }: {
  invoice: Invoice;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<Payment['payment_method']>('cash');

  const load = useCallback(() => {
    setItems(db.list('invoice_items', (i) => i.invoice_id === invoice.id));
    setInstallments(db.orderBy(db.list('installments', (i) => i.invoice_id === invoice.id), 'installment_number'));
    setPayments(db.orderBy(db.list('payments', (p) => p.invoice_id === invoice.id), 'payment_date', { ascending: false }));
    setLoading(false);
  }, [invoice.id]);

  useEffect(() => { load(); }, [load]);

  function recordPayment() {
    if (payAmount <= 0) { showToast('مبلغ را وارد کنید', 'error'); return; }
    const payment = db.insert('payments', {
      invoice_id: invoice.id,
      patient_id: invoice.patient_id,
      amount: payAmount,
      payment_method: payMethod,
      payment_date: todayISO(),
    });

    const newPaid = invoice.paid_amount + payAmount;
    const newBalance = invoice.total - newPaid;
    const newStatus = newBalance <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

    db.update('invoices', invoice.id, {
      paid_amount: newPaid,
      balance: newBalance,
      status: newStatus,
    });

    syncPatientBalance(invoice.patient_id);

    if (invoice.payment_type === 'installment' && installments.length > 0) {
      const unpaid = installments.find((inst) => !inst.paid);
      if (unpaid) {
        db.update('installments', unpaid.id, {
          paid: true,
          paid_date: todayISO(),
          payment_id: payment.id,
        });
      }
    }

    showToast('پرداخت ثبت شد');
    setShowPayment(false);
    setPayAmount(0);
    onUpdated();
    load();
  }

  function updateInstallmentDueDate(instId: string, dueDate: string) {
    db.update('installments', instId, { due_date: dueDate });
    showToast('تاریخ قسط بروزرسانی شد');
    load();
  }

  return (
    <Modal open onClose={onClose} title={`صورتحساب ${invoice.invoice_number || ''}`} size="lg">
      {loading ? (
        <Skeleton className="h-40" variant="inset" />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
            <div>
              <p className="text-xs text-surface-400">مبلغ کل</p>
              <p className="text-lg font-bold text-surface-800">{formatCurrency(invoice.total)}</p>
            </div>
            <div>
              <p className="text-xs text-surface-400">پرداخت شده</p>
              <p className="text-sm font-medium text-accent-600">{formatCurrency(invoice.paid_amount)}</p>
            </div>
            <div>
              <p className="text-xs text-surface-400">باقی‌مانده</p>
              <p className="text-sm font-medium text-error-600">{formatCurrency(invoice.balance)}</p>
            </div>
            <StatusBadge status={statusStyle(invoiceStatus, invoice.status, 'unpaid')} />
          </div>

          <div>
            <h4 className="font-semibold text-surface-700 text-sm mb-3">اقلام صورتحساب</h4>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-surface-700">{item.description}</p>
                    <p className="text-xs text-surface-400">{formatNumber(item.quantity)} × {formatCurrency(item.unit_price)}</p>
                  </div>
                  <p className="text-sm font-bold text-surface-700">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>
          </div>

          {installments.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-surface-700 text-sm">اقساط</h4>
                <span className="text-xs text-surface-400">
                  {formatNumber(installments.filter((i) => i.paid).length)} از {formatNumber(installments.length)} پرداخت شده
                </span>
              </div>
              <div className="space-y-2">
                {installments.map((inst) => {
                  const isOverdue = !inst.paid && isPast(inst.due_date);
                  return (
                    <div key={inst.id} className={`flex items-center justify-between p-3 rounded-xl ${inst.paid ? 'bg-accent-50' : isOverdue ? 'bg-error-50' : 'bg-surface-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${inst.paid ? 'bg-accent-100' : isOverdue ? 'bg-error-100' : 'bg-warning-50'}`}>
                          {inst.paid ? <CheckCircle2 size={16} className="text-accent-500" /> : <Clock size={16} className={isOverdue ? 'text-error-500' : 'text-warning-500'} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-surface-700">قسط {formatNumber(inst.installment_number)}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <JalaliDateInput
                              variant="inline"
                              clearable={false}
                              value={inst.due_date}
                              disabled={inst.paid}
                              onChange={(dueDate) => updateInstallmentDueDate(inst.id, dueDate)}
                              className="text-xs text-surface-500 bg-transparent border-0 outline-none cursor-pointer hover:text-primary-600 transition-colors"
                            />
                            {isOverdue && <span className="text-[10px] text-error-600 font-medium">سررسید گذشته</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-surface-700">{formatCurrency(inst.amount)}</p>
                        {inst.paid ? (
                          <span className="text-xs text-accent-600">پرداخت شده</span>
                        ) : isOverdue ? (
                          <span className="text-xs text-error-600">معوق</span>
                        ) : (
                          <span className="text-xs text-surface-400">در انتظار</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {payments.length > 0 && (
            <div>
              <h4 className="font-semibold text-surface-700 text-sm mb-3">تاریخچه پرداخت‌ها</h4>
              <div className="space-y-2">
                {payments.map((pay) => (
                  <div key={pay.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
                        <Wallet size={16} className="text-accent-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-700">{formatCurrency(pay.amount)}</p>
                        <p className="text-xs text-surface-400">{formatDate(pay.payment_date)} • {paymentMethodLabel(pay.payment_method)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {invoice.balance > 0 && (
            <div className="border-t border-surface-100 pt-4">
              {!showPayment ? (
                <button onClick={() => { setPayAmount(invoice.balance); setShowPayment(true); }} className="btn-primary w-full">
                  <DollarSign size={18} />
                  ثبت پرداخت
                </button>
              ) : (
                <div className="space-y-3 animate-slide-down">
                  <div>
                    <label className="label-field">مبلغ پرداخت (تومان)</label>
                    <input type="number" className="input-field" value={payAmount} onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="label-field">روش پرداخت</label>
                    <ChoiceChips options={paymentMethods} value={payMethod} onChange={setPayMethod} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={recordPayment} className="btn-primary flex-1">ثبت پرداخت</button>
                    <button onClick={() => setShowPayment(false)} className="btn-secondary">انصراف</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
