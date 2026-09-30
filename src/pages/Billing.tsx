import { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  Plus,
  DollarSign,
  Clock,
  CheckCircle2,
  X,
  CreditCard,
  Wallet,
  Calendar,
  AlertCircle,
  Bell,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, formatNumber, getInitials } from '@/lib/format';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/Toast';
import type { Invoice, Patient, Service, InvoiceItem, Installment, Payment, PageKey } from '@/lib/types';

interface BillingProps {
  onNavigate: (page: PageKey) => void;
  onOpenPatient: (patientId: string) => void;
}

export function Billing({ onOpenPatient }: BillingProps) {
  const [invoices, setInvoices] = useState<(Invoice & { patient?: Patient })[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');
  const [installmentReminders, setInstallmentReminders] = useState<(Installment & { patient?: Patient; invoice?: Invoice })[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [invRes, instRes] = await Promise.all([
      supabase.from('invoices').select('*, patient:patients(*)').order('created_at', { ascending: false }),
      supabase.from('installments').select('*, invoice:invoices(*), patient:patients(*)').eq('paid', false).order('due_date'),
    ]);
    setInvoices(invRes.data || []);
    setInstallmentReminders(instRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    supabase.from('patients').select('*').order('first_name').then(({ data }) => setPatients(data || []));
    supabase.from('services').select('*').eq('active', true).then(({ data }) => setServices(data || []));
  }, [load]);

  const filtered = invoices.filter((inv) => {
    if (filter === 'all') return true;
    return inv.status === filter;
  });

  const totalRevenue = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const totalPending = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + i.balance, 0);
  const totalInvoices = invoices.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-surface-800">صورتحساب</h1>
          <p className="text-sm text-surface-400 mt-1">مدیریت مالی و پرداخت‌ها</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={18} />
          صورتحساب جدید
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card animate-slide-up">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-surface-500 mb-2">کل صورتحساب‌ها</p>
              <p className="text-2xl font-bold text-surface-800">{formatNumber(totalInvoices)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center">
              <Receipt size={18} className="text-secondary-500" />
            </div>
          </div>
        </div>
        <div className="stat-card animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-surface-500 mb-2">درآمد کل</p>
              <p className="text-lg font-bold text-accent-600">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
              <DollarSign size={18} className="text-accent-500" />
            </div>
          </div>
        </div>
        <div className="stat-card animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-surface-500 mb-2">مطالبات معوق</p>
              <p className="text-lg font-bold text-error-600">{formatCurrency(totalPending)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-error-50 flex items-center justify-center">
              <Clock size={18} className="text-error-500" />
            </div>
          </div>
        </div>
        <div className="stat-card animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-surface-500 mb-2">پرداخت نشده</p>
              <p className="text-2xl font-bold text-warning-600">{formatNumber(invoices.filter((i) => i.status !== 'paid').length)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center">
              <Clock size={18} className="text-warning-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Installment Reminders */}
      {installmentReminders.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center">
                <Bell size={18} className="text-warning-500" />
              </div>
              <div>
                <h3 className="font-bold text-surface-800 text-sm">یادآوری اقساط</h3>
                <p className="text-xs text-surface-400 mt-0.5">{formatNumber(installmentReminders.length)} قسط در انتظار پرداخت</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {installmentReminders.slice(0, 5).map((inst) => {
              const isOverdue = inst.due_date && new Date(inst.due_date) < new Date();
              const daysUntil = inst.due_date ? Math.ceil((new Date(inst.due_date).getTime() - Date.now()) / 86400000) : 0;
              return (
                <div
                  key={inst.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${isOverdue ? 'bg-error-50' : daysUntil <= 3 ? 'bg-warning-50' : 'bg-surface-50'}`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isOverdue ? 'bg-error-100' : 'bg-warning-100'}`}>
                    <Clock size={16} className={isOverdue ? 'text-error-500' : 'text-warning-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-700 truncate">
                      {inst.patient ? `${inst.patient.first_name} ${inst.patient.last_name}` : 'نامشخص'}
                    </p>
                    <p className="text-xs text-surface-400">
                      قسط {formatNumber(inst.installment_number)} • سررسید: {formatDate(inst.due_date)}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-surface-700">{formatCurrency(inst.amount)}</p>
                    <span className={`text-xs ${isOverdue ? 'text-error-600' : daysUntil <= 3 ? 'text-warning-600' : 'text-surface-400'}`}>
                      {isOverdue ? `${formatNumber(Math.abs(daysUntil))} روز گذشته` : daysUntil === 0 ? 'امروز' : `${formatNumber(daysUntil)} روز دیگر`}
                    </span>
                  </div>
                  {inst.invoice && (
                    <button
                      onClick={() => setDetailInvoice(inst.invoice || null)}
                      className="px-3 py-1.5 rounded-lg bg-white text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
                    >
                      مشاهده
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'unpaid', 'partial', 'paid'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f ? 'bg-primary-50 text-primary-600' : 'bg-white text-surface-400 hover:bg-surface-50 border border-surface-100'
            }`}
          >
            {f === 'all' ? 'همه' : f === 'unpaid' ? 'پرداخت نشده' : f === 'partial' ? 'پرداخت جزئی' : 'پرداخت شده'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-surface-100 animate-pulse-soft" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="هیچ صورتحسابی" description="صورتحساب جدید ایجاد کنید" />
      ) : (
        <div className="space-y-3">
          {filtered.map((inv, i) => {
            const statusConfig = {
              paid: { bg: 'bg-accent-50', text: 'text-accent-600', label: 'پرداخت شده' },
              partial: { bg: 'bg-warning-50', text: 'text-warning-600', label: 'پرداخت جزئی' },
              unpaid: { bg: 'bg-error-50', text: 'text-error-600', label: 'پرداخت نشده' },
              overdue: { bg: 'bg-error-100', text: 'text-error-700', label: 'سررسید گذشته' },
            };
            const sc = statusConfig[inv.status as keyof typeof statusConfig] || statusConfig.unpaid;
            return (
              <div
                key={inv.id}
                className="card card-hover p-4 cursor-pointer animate-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => setDetailInvoice(inv)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                    {inv.patient ? getInitials(inv.patient.first_name, inv.patient.last_name) : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-800 text-sm">
                      {inv.patient ? `${inv.patient.first_name} ${inv.patient.last_name}` : 'نامشخص'}
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5">{formatDate(inv.created_at)}</p>
                    {inv.payment_type === 'installment' && (
                      <span className="badge bg-secondary-50 text-secondary-600 mt-1">
                        <CreditCard size={10} />
                        اقساطی ({formatNumber(inv.installment_count)} قسط)
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-surface-800 text-sm">{formatCurrency(inv.total)}</p>
                    <span className={`badge ${sc.bg} ${sc.text} mt-1`}>{sc.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <InvoiceForm
          patients={patients}
          services={services}
          onClose={() => setShowForm(false)}
          onSaved={() => { load(); setShowForm(false); }}
        />
      )}

      {detailInvoice && (
        <InvoiceDetail
          invoice={detailInvoice}
          onClose={() => setDetailInvoice(null)}
          onOpenPatient={onOpenPatient}
          onUpdated={load}
        />
      )}
    </div>
  );
}

function InvoiceForm({ patients, services, onClose, onSaved }: {
  patients: Patient[];
  services: Service[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [patientId, setPatientId] = useState('');
  const [items, setItems] = useState<{ service_id: string; description: string; quantity: number; unit_price: number }[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentType, setPaymentType] = useState<'full' | 'installment'>('full');
  const [installmentCount, setInstallmentCount] = useState(3);
  const [saving, setSaving] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  function addItem() {
    setItems([...items, { service_id: '', description: '', quantity: 1, unit_price: 0 }]);
  }

  function updateItem(index: number, field: string, value: string | number) {
    const newItems = [...items];
    (newItems[index] as Record<string, string | number>)[field] = value;
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

  async function handleSave() {
    if (!patientId) { showToast('بیمار را انتخاب کنید', 'error'); return; }
    if (items.length === 0) { showToast('حداقل یک خدمت اضافه کنید', 'error'); return; }
    setSaving(true);

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const { data: invoice, error: invError } = await supabase.from('invoices').insert({
      patient_id: patientId,
      invoice_number: invoiceNumber,
      subtotal,
      discount,
      total,
      paid_amount: 0,
      balance: total,
      status: 'unpaid',
      payment_type: paymentType === 'installment' ? 'installment' : 'full',
      installment_count: paymentType === 'installment' ? installmentCount : 0,
    }).select().single();

    if (invError || !invoice) { showToast('خطا در ثبت صورتحساب', 'error'); setSaving(false); return; }

    const itemInserts = items.map((item) => ({
      invoice_id: invoice.id,
      service_id: item.service_id || null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.unit_price * item.quantity,
    }));
    await supabase.from('invoice_items').insert(itemInserts);

    if (paymentType === 'installment' && installmentCount > 0) {
      const installmentAmount = Math.round(total / installmentCount);
      const installments: Omit<Installment, 'id' | 'created_at' | 'paid_date' | 'payment_id'>[] = [];
      for (let i = 0; i < installmentCount; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i + 1);
        installments.push({
          invoice_id: invoice.id,
          installment_number: i + 1,
          amount: i === installmentCount - 1 ? total - installmentAmount * (installmentCount - 1) : installmentAmount,
          due_date: dueDate.toISOString().split('T')[0],
          paid: false,
        });
      }
      await supabase.from('installments').insert(installments);
    }

    await supabase.from('patients').update({ balance: total }).eq('id', patientId);

    showToast('صورتحساب ایجاد شد');
    setSaving(false);
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="صورتحساب جدید" size="lg">
      <div className="space-y-5">
        <div>
          <label className="label-field">بیمار *</label>
          <select className="input-field" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            <option value="">انتخاب بیمار</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} - {p.phone}</option>)}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-surface-600">خدمات</label>
            <button onClick={addItem} className="text-xs text-primary-600 font-medium hover:text-primary-700">+ افزودن</button>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-surface-50 rounded-xl">
                <select
                  className="input-field flex-1"
                  value={item.service_id}
                  onChange={(e) => selectService(i, e.target.value)}
                >
                  <option value="">انتخاب خدمت</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input
                  type="number"
                  className="input-field w-16"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                  placeholder="تعداد"
                />
                <input
                  type="number"
                  className="input-field w-28"
                  value={item.unit_price}
                  onChange={(e) => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)}
                  placeholder="قیمت"
                />
                <button onClick={() => removeItem(i)} className="p-2 rounded-lg hover:bg-error-50">
                  <X size={16} className="text-error-400" />
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
            <input type="number" className="input-field" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} />
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
            <div className="flex items-center gap-2">
              {[2, 3, 4, 6, 12].map((n) => (
                <button
                  key={n}
                  onClick={() => setInstallmentCount(n)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    installmentCount === n ? 'bg-primary-50 text-primary-600 border border-primary-200' : 'bg-surface-50 text-surface-400 border border-surface-100'
                  }`}
                >
                  {formatNumber(n)} قسط
                </button>
              ))}
            </div>
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
            <span className="text-surface-700">مبلغ نهایی:</span>
            <span className="text-primary-600">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'در حال ثبت...' : 'ثبت صورتحساب'}
          </button>
          <button onClick={onClose} className="btn-secondary">انصراف</button>
        </div>
      </div>
    </Modal>
  );
}

function InvoiceDetail({ invoice, onClose, onOpenPatient, onUpdated }: {
  invoice: Invoice;
  onClose: () => void;
  onOpenPatient: (id: string) => void;
  onUpdated: () => void;
}) {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('cash');

  const load = useCallback(async () => {
    setLoading(true);
    const [itemsRes, instRes, payRes] = await Promise.all([
      supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id),
      supabase.from('installments').select('*').eq('invoice_id', invoice.id).order('installment_number'),
      supabase.from('payments').select('*').eq('invoice_id', invoice.id).order('payment_date', { ascending: false }),
    ]);
    setItems(itemsRes.data || []);
    setInstallments(instRes.data || []);
    setPayments(payRes.data || []);
    setLoading(false);
  }, [invoice.id]);

  useEffect(() => { load(); }, [load]);

  async function recordPayment() {
    if (payAmount <= 0) { showToast('مبلغ را وارد کنید', 'error'); return; }
    const { data: payment, error: payError } = await supabase.from('payments').insert({
      invoice_id: invoice.id,
      patient_id: invoice.patient_id,
      amount: payAmount,
      payment_method: payMethod,
      payment_date: new Date().toISOString().split('T')[0],
    }).select().single();

    if (payError || !payment) { showToast('خطا در ثبت پرداخت', 'error'); return; }

    const newPaid = invoice.paid_amount + payAmount;
    const newBalance = invoice.total - newPaid;
    const newStatus = newBalance <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

    await supabase.from('invoices').update({
      paid_amount: newPaid,
      balance: newBalance,
      status: newStatus,
    }).eq('id', invoice.id);

    await supabase.from('patients').update({ balance: newBalance }).eq('id', invoice.patient_id);

    if (invoice.payment_type === 'installment' && installments.length > 0) {
      const unpaid = installments.find((inst) => !inst.paid);
      if (unpaid) {
        await supabase.from('installments').update({
          paid: true,
          paid_date: new Date().toISOString().split('T')[0],
          payment_id: payment.id,
        }).eq('id', unpaid.id);
      }
    }

    showToast('پرداخت ثبت شد');
    setShowPayment(false);
    setPayAmount(0);
    onUpdated();
    load();
  }

  async function updateInstallmentDueDate(instId: string, dueDate: string) {
    const { error } = await supabase.from('installments').update({ due_date: dueDate }).eq('id', instId);
    if (error) showToast('خطا در بروزرسانی', 'error');
    else { showToast('تاریخ قسط بروزرسانی شد'); load(); }
  }

  const statusConfig = {
    paid: { bg: 'bg-accent-50', text: 'text-accent-600', label: 'پرداخت شده' },
    partial: { bg: 'bg-warning-50', text: 'text-warning-600', label: 'پرداخت جزئی' },
    unpaid: { bg: 'bg-error-50', text: 'text-error-600', label: 'پرداخت نشده' },
    overdue: { bg: 'bg-error-100', text: 'text-error-700', label: 'سررسید گذشته' },
  };
  const sc = statusConfig[invoice.status as keyof typeof statusConfig] || statusConfig.unpaid;

  return (
    <Modal open onClose={onClose} title={`صورتحساب ${invoice.invoice_number || ''}`} size="lg">
      {loading ? (
        <div className="h-40 bg-surface-50 rounded-xl animate-pulse-soft" />
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
            <span className={`badge ${sc.bg} ${sc.text}`}>{sc.label}</span>
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
                  const isOverdue = !inst.paid && inst.due_date && new Date(inst.due_date) < new Date();
                  return (
                    <div key={inst.id} className={`flex items-center justify-between p-3 rounded-xl ${inst.paid ? 'bg-accent-50' : isOverdue ? 'bg-error-50' : 'bg-surface-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${inst.paid ? 'bg-accent-100' : isOverdue ? 'bg-error-100' : 'bg-warning-50'}`}>
                          {inst.paid ? <CheckCircle2 size={16} className="text-accent-500" /> : <Clock size={16} className={isOverdue ? 'text-error-500' : 'text-warning-500'} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-surface-700">قسط {formatNumber(inst.installment_number)}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <input
                              type="date"
                              value={inst.due_date || ''}
                              disabled={inst.paid}
                              onChange={(e) => updateInstallmentDueDate(inst.id, e.target.value)}
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
                        <p className="text-xs text-surface-400">{formatDate(pay.payment_date)} • {payMethodLabel(pay.payment_method)}</p>
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
                    <div className="flex items-center gap-2">
                      {(['cash', 'card', 'online', 'transfer'] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setPayMethod(m)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            payMethod === m ? 'bg-primary-50 text-primary-600 border border-primary-200' : 'bg-surface-50 text-surface-400 border border-surface-100'
                          }`}
                        >
                          {payMethodLabel(m)}
                        </button>
                      ))}
                    </div>
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

function payMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'نقدی',
    card: 'کارت',
    online: 'آنلاین',
    transfer: 'انتقال',
  };
  return labels[method] || method;
}
