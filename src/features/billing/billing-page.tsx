import { useState, useEffect, useCallback, useMemo } from 'react';
import { Check, Plus, Receipt } from 'lucide-react';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { StatusBadge } from '@/components/ui/status-badge';
import { invoiceStatus, statusStyle } from '@/constants/status';
import { daysUntil, formatDate, formatDateNumeric, isPast } from '@/lib/date';
import { formatCurrency, formatNumber, fullName, percent } from '@/lib/format';
import { usePatients } from '@/data/patients';
import { useServices } from '@/data/services';
import * as db from '@/lib/store';
import type { Installment, Invoice, Patient } from '@/lib/types';
import { InvoiceDetail } from './invoice-detail';
import { InvoiceForm } from './invoice-form';

type InvoiceFilter = 'all' | Invoice['status'];

const filters: { value: InvoiceFilter; label: string }[] = [
  { value: 'all', label: 'همه' },
  ...(['paid', 'partial', 'unpaid', 'overdue'] as const).map((value) => ({ value, label: invoiceStatus[value].label })),
];

interface BillingProps {
  onOpenPatient: (patientId: string) => void;
}

export function Billing({ onOpenPatient }: BillingProps) {
  const [invoiceRows, setInvoiceRows] = useState<Invoice[]>([]);
  const { data: allPatients = [] } = usePatients();
  const { data: allServices = [] } = useServices();
  const patients = useMemo(() => [...allPatients].sort((a, b) => a.first_name.localeCompare(b.first_name, 'fa')), [allPatients]);
  const services = useMemo(() => allServices.filter((s) => s.active), [allServices]);
  const invoices = useMemo(() => db.joinOne(invoiceRows, 'patient', allPatients, 'patient_id'), [invoiceRows, allPatients]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [filter, setFilter] = useState<InvoiceFilter>('all');
  const [unpaidInstallments, setUnpaidInstallments] = useState<(Installment & { invoice?: Invoice })[]>([]);
  // Installments have no patient_id; the patient is reached through the invoice.
  const installmentReminders: (Installment & { patient?: Patient; invoice?: Invoice })[] = useMemo(() => {
    const byId = new Map(allPatients.map((p) => [p.id, p]));
    return unpaidInstallments.map((inst) => ({ ...inst, patient: inst.invoice ? byId.get(inst.invoice.patient_id) : undefined }));
  }, [unpaidInstallments, allPatients]);

  const load = useCallback(() => {
    setLoading(true);
    const invoiceRows = db.orderBy(db.list('invoices'), 'created_at', { ascending: false });
    const withInstallments = db.withMany(invoiceRows, 'installments', 'installments', 'invoice_id').map((inv) => ({
      ...inv,
      installments: db.orderBy(inv.installments, 'installment_number'),
    }));
    setInvoiceRows(withInstallments);
    const unpaid = db.withOne(db.orderBy(db.list('installments', (i) => !i.paid), 'due_date'), 'invoice', 'invoices', 'invoice_id');
    setUnpaidInstallments(unpaid);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = invoices.filter((inv) => filter === 'all' || inv.status === filter);
  const unpaidInvoices = invoices.filter((i) => i.status !== 'paid');
  const totalReceived = invoices.reduce((s, i) => s + i.paid_amount, 0);
  const totalPending = unpaidInvoices.reduce((s, i) => s + i.balance, 0);

  return (
    <div className="space-y-5">
      <PageHeader title="صورتحساب" subtitle={<>{formatNumber(invoices.length)} فاکتور</>}>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} />
          فاکتور جدید
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="کل فاکتورها" value={formatNumber(invoices.length)} valueClassName="text-surface-700" />
        <StatTile label="دریافت شده" value={formatCurrency(totalReceived)} valueClassName="text-accent-600" />
        <StatTile label="در انتظار" value={formatCurrency(totalPending)} valueClassName="text-warning-600" />
        <StatTile label="اقساطی" value={formatNumber(invoices.filter((i) => i.payment_type === 'installment').length)} valueClassName="text-primary-600" />
      </div>

      {installmentReminders.length > 0 && (
        <div className="card p-5">
          <SectionHeader title="یادآوری اقساط" note={`${formatNumber(installmentReminders.length)} قسط در انتظار پرداخت`} className="mb-3" />
          <div className="space-y-2">
            {installmentReminders.slice(0, 5).map((inst) => {
              const daysLeft = daysUntil(inst.due_date);
              const isOverdue = daysLeft < 0;
              const tone = isOverdue ? 'bg-error-50 border-error-200' : daysLeft <= 3 ? 'bg-warning-50 border-warning-200' : 'bg-surface-50 border-surface-100';
              return (
                <div key={inst.id} className={`flex items-center gap-3 p-3 rounded-xl border ${tone}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">{fullName(inst.patient)}</p>
                    <p className="text-xs text-surface-500">
                      قسط {formatNumber(inst.installment_number)} · سررسید {formatDate(inst.due_date)}
                    </p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-sm font-bold text-surface-800">{formatCurrency(inst.amount)}</p>
                    <span className={`text-xs ${isOverdue ? 'text-error-600' : daysLeft <= 3 ? 'text-warning-600' : 'text-surface-400'}`}>
                      {isOverdue ? `${formatNumber(-daysLeft)} روز گذشته` : daysLeft === 0 ? 'امروز' : `${formatNumber(daysLeft)} روز دیگر`}
                    </span>
                  </div>
                  {inst.invoice && (
                    <button onClick={() => setDetailInvoice(inst.invoice || null)} className="btn-chip bg-white text-primary-700 border-primary-200 hover:bg-primary-50 shrink-0">
                      مشاهده
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ChoiceChips options={filters} value={filter} onChange={setFilter} />

      {loading ? (
        <div className="space-y-3">
          <SkeletonList count={4} className="h-36" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="فاکتوری یافت نشد" description="فیلتر را تغییر دهید یا فاکتور جدیدی صادر کنید" />
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => (
            <div key={inv.id} className="card card-hover p-5 cursor-pointer" onClick={() => setDetailInvoice(inv)}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenPatient(inv.patient_id); }}
                      className="text-sm font-bold text-surface-800 hover:text-primary-600 transition-colors"
                    >
                      {fullName(inv.patient)}
                    </button>
                    {inv.treatment_plan_id && <span className="text-xs bg-primary-50 text-primary-600 border border-primary-200 px-1.5 py-0.5 rounded-lg whitespace-nowrap">طرح درمان</span>}
                  </div>
                  <p className="text-xs text-surface-400 mt-0.5">
                    {inv.invoice_number && <>{inv.invoice_number} · </>}
                    {formatDate(inv.created_at)} · {inv.payment_type === 'installment' ? `${formatNumber(inv.installment_count)} قسطه` : 'یکجا'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={statusStyle(invoiceStatus, inv.status, 'unpaid')} />
                  {inv.status !== 'paid' && (
                    <span className="btn-chip px-2 py-1 bg-accent-600 border-accent-600 text-white hover:bg-accent-700">ثبت پرداخت</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                <div>
                  <p className="text-xs text-surface-400">مبلغ کل</p>
                  <p className="font-bold text-surface-800">{formatCurrency(inv.total)}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-400">پرداخت شده</p>
                  <p className="font-semibold text-accent-600">{formatCurrency(inv.paid_amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-400">مانده</p>
                  <p className="font-semibold text-warning-600">{formatCurrency(inv.balance)}</p>
                </div>
              </div>
              {inv.total > 0 && <ProgressBar value={percent(inv.paid_amount, inv.total)} barClassName="bg-accent-500" />}
              {inv.installments && inv.installments.length > 0 && (
                <div className="border-t border-surface-100 pt-3 mt-3">
                  <p className="text-xs font-medium text-surface-600 mb-2">جدول اقساط:</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {inv.installments.map((inst) => (
                      <div
                        key={inst.id}
                        className={`shrink-0 text-center p-2 rounded-xl border text-xs min-w-max ${
                          inst.paid ? 'bg-accent-50 border-accent-200 text-accent-700' : isPast(inst.due_date) ? 'bg-error-50 border-error-200 text-error-700' : 'bg-surface-50 border-surface-200 text-surface-600'
                        }`}
                      >
                        <p className="font-medium">قسط {formatNumber(inst.installment_number)}</p>
                        <p className="font-bold">{formatCurrency(inst.amount)}</p>
                        <p className="opacity-70">{formatDateNumeric(inst.due_date)}</p>
                        {inst.paid && (
                          <p className="font-medium inline-flex items-center gap-0.5">
                            <Check size={11} />
                            پرداخت شد
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
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
          onUpdated={load}
        />
      )}
    </div>
  );
}
