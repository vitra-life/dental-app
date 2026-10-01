import { useState, useEffect, useCallback } from 'react';
import { Bell, Clock, CreditCard, DollarSign, Plus, Receipt } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { StatusBadge } from '@/components/ui/status-badge';
import { invoiceStatus, statusStyle } from '@/constants/status';
import { daysUntil, formatDate } from '@/lib/date';
import { formatCurrency, formatNumber, fullName, getInitials } from '@/lib/format';
import * as db from '@/lib/store';
import type { Installment, Invoice, Patient, Service } from '@/lib/types';
import { InvoiceDetail } from './invoice-detail';
import { InvoiceForm } from './invoice-form';

type InvoiceFilter = 'all' | 'unpaid' | 'partial' | 'paid';

const filters: { key: InvoiceFilter; label: string }[] = [
  { key: 'all', label: 'همه' },
  { key: 'unpaid', label: 'پرداخت نشده' },
  { key: 'partial', label: 'پرداخت جزئی' },
  { key: 'paid', label: 'پرداخت شده' },
];

export function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [filter, setFilter] = useState<InvoiceFilter>('all');
  const [installmentReminders, setInstallmentReminders] = useState<(Installment & { patient?: Patient; invoice?: Invoice })[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    const invoiceRows = db.orderBy(db.list('invoices'), 'created_at', { ascending: false });
    setInvoices(db.withOne(invoiceRows, 'patient', 'patients', 'patient_id'));
    // Installments have no patient_id; the patient is reached through the invoice.
    const unpaid = db.withOne(db.orderBy(db.list('installments', (i) => !i.paid), 'due_date'), 'invoice', 'invoices', 'invoice_id');
    setInstallmentReminders(unpaid.map((inst) => ({
      ...inst,
      patient: inst.invoice ? db.get('patients', inst.invoice.patient_id) ?? undefined : undefined,
    })));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    setPatients(db.orderBy(db.list('patients'), 'first_name'));
    setServices(db.list('services', (s) => s.active));
  }, [load]);

  const filtered = invoices.filter((inv) => filter === 'all' || inv.status === filter);
  const unpaidInvoices = invoices.filter((i) => i.status !== 'paid');
  const totalRevenue = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const totalPending = unpaidInvoices.reduce((s, i) => s + i.balance, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="صورتحساب" subtitle="مدیریت مالی و پرداخت‌ها">
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={18} />
          صورتحساب جدید
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="کل صورتحساب‌ها" value={formatNumber(invoices.length)} icon={Receipt} tone="secondary" />
        <StatTile label="درآمد کل" value={formatCurrency(totalRevenue)} icon={DollarSign} tone="accent" size="lg" valueClassName="text-accent-600" delay={100} />
        <StatTile label="مطالبات معوق" value={formatCurrency(totalPending)} icon={Clock} tone="error" size="lg" valueClassName="text-error-600" delay={200} />
        <StatTile label="پرداخت نشده" value={formatNumber(unpaidInvoices.length)} icon={Clock} tone="warning" valueClassName="text-warning-600" delay={300} />
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
              const daysLeft = daysUntil(inst.due_date);
              const isOverdue = daysLeft < 0;
              return (
                <div
                  key={inst.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${isOverdue ? 'bg-error-50' : daysLeft <= 3 ? 'bg-warning-50' : 'bg-surface-50'}`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isOverdue ? 'bg-error-100' : 'bg-warning-100'}`}>
                    <Clock size={16} className={isOverdue ? 'text-error-500' : 'text-warning-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-700 truncate">{fullName(inst.patient)}</p>
                    <p className="text-xs text-surface-400">
                      قسط {formatNumber(inst.installment_number)} • سررسید: {formatDate(inst.due_date)}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-surface-700">{formatCurrency(inst.amount)}</p>
                    <span className={`text-xs ${isOverdue ? 'text-error-600' : daysLeft <= 3 ? 'text-warning-600' : 'text-surface-400'}`}>
                      {isOverdue ? `${formatNumber(-daysLeft)} روز گذشته` : daysLeft === 0 ? 'امروز' : `${formatNumber(daysLeft)} روز دیگر`}
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
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f.key ? 'bg-primary-50 text-primary-600' : 'bg-white text-surface-400 hover:bg-surface-50 border border-surface-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonList count={4} className="h-20" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="هیچ صورتحسابی" description="صورتحساب جدید ایجاد کنید" />
      ) : (
        <div className="space-y-3">
          {filtered.map((inv, i) => (
            <div
              key={inv.id}
              className="card card-hover p-4 cursor-pointer animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => setDetailInvoice(inv)}
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-11 h-11 rounded-xl text-sm shrink-0">
                  {inv.patient ? getInitials(inv.patient.first_name, inv.patient.last_name) : '?'}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-800 text-sm">{fullName(inv.patient)}</p>
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
                  <StatusBadge status={statusStyle(invoiceStatus, inv.status, 'unpaid')} className="mt-1" />
                </div>
              </div>
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
