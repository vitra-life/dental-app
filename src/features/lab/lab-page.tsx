import { useState, useEffect, useCallback } from 'react';
import { Clock, DollarSign, FlaskConical, Mail, MapPin, Package, Phone, Plus } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, type TabItem } from '@/components/ui/tabs';
import { labOrderStatus, statusStyle } from '@/constants/status';
import { formatDate, todayISO } from '@/lib/date';
import { formatCurrency, formatNumber, fullName, paymentMethodLabel } from '@/lib/format';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { Lab as LabRow, LabOrder, LabPayment, Patient } from '@/lib/types';
import { LabForm } from './lab-form';
import { LabOrderForm } from './lab-order-form';
import { LabPaymentForm } from './lab-payment-form';

interface LabProps {
  onOpenPatient: (patientId: string) => void;
}

type LabTab = 'orders' | 'labs' | 'payments';

const tabs: TabItem<LabTab>[] = [
  { key: 'orders', label: 'سفارشات', icon: <Package size={16} /> },
  { key: 'labs', label: 'لابراتوارها', icon: <FlaskConical size={16} /> },
  { key: 'payments', label: 'پرداخت‌ها', icon: <DollarSign size={16} /> },
];

/** The next step for an order in each status, and the toast shown after taking it. */
const nextStep: Partial<Record<LabOrder['status'], { to: LabOrder['status']; action: string; toast: string }>> = {
  pending: { to: 'in_progress', action: 'شروع ساخت', toast: 'وضعیت بروزرسانی شد' },
  in_progress: { to: 'ready', action: 'آماده شد', toast: 'وضعیت بروزرسانی شد' },
  ready: { to: 'delivered', action: 'تحویل به بیمار', toast: 'تحویل داده شد' },
};

export function Lab({ onOpenPatient }: LabProps) {
  const [tab, setTab] = useState<LabTab>('orders');
  const [labs, setLabs] = useState<LabRow[]>([]);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [labPayments, setLabPayments] = useState<(LabPayment & { lab?: LabRow })[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLabForm, setShowLabForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedLab, setSelectedLab] = useState<LabRow | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const orderRows = db.orderBy(db.list('lab_orders'), 'created_at', { ascending: false });
    const paymentRows = db.orderBy(db.list('lab_payments'), 'payment_date', { ascending: false });
    setLabs(db.orderBy(db.list('labs'), 'name'));
    setOrders(db.withOne(db.withOne(orderRows, 'lab', 'labs', 'lab_id'), 'patient', 'patients', 'patient_id'));
    setLabPayments(db.withOne(paymentRows, 'lab', 'labs', 'lab_id'));
    setPatients(db.orderBy(db.list('patients'), 'first_name'));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function advanceOrder(order: LabOrder) {
    const step = nextStep[order.status];
    if (!step) return;
    db.update('lab_orders', order.id, {
      status: step.to,
      ...(step.to === 'delivered' ? { delivered_date: todayISO() } : {}),
    });
    showToast(step.toast);
    load();
  }

  const totalLabDebt = labs.reduce((s, l) => s + l.balance, 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'in_progress').length;
  const totalLabCost = orders.reduce((s, o) => s + o.price, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="لابراتوار" subtitle="مدیریت سفارشات و پرداخت‌های لابراتوار">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowLabForm(true)} className="btn-secondary">
            <Plus size={18} />
            لابراتوار
          </button>
          <button onClick={() => setShowOrderForm(true)} className="btn-primary">
            <Plus size={18} />
            سفارش جدید
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="لابراتوارها" value={formatNumber(labs.length)} icon={FlaskConical} tone="secondary" />
        <StatTile label="سفارشات در انتظار" value={formatNumber(pendingOrders)} icon={Clock} tone="warning" valueClassName="text-warning-600" delay={100} />
        <StatTile label="هزینه کل لابراتوار" value={formatCurrency(totalLabCost)} icon={DollarSign} tone="primary" size="lg" delay={200} />
        <StatTile label="بدهی به لابراتوارها" value={formatCurrency(totalLabDebt)} icon={DollarSign} tone="error" size="lg" valueClassName="text-error-600" delay={300} />
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} scrollable={false} />

      {loading ? (
        <div className="space-y-3">
          <SkeletonList count={3} className="h-20" />
        </div>
      ) : tab === 'orders' ? (
        orders.length === 0 ? (
          <EmptyState icon={Package} title="هیچ سفارشی" description="سفارش لابراتوار جدید ثبت کنید" action={<button onClick={() => setShowOrderForm(true)} className="btn-primary"><Plus size={18} />سفارش جدید</button>} />
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const step = nextStep[order.status];
              return (
                <div key={order.id} className="card card-hover p-4 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-secondary-50 flex items-center justify-center shrink-0">
                      <FlaskConical size={20} className="text-secondary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-surface-800 text-sm">{order.service_name}</p>
                      <button onClick={() => onOpenPatient(order.patient_id)} className="text-xs text-primary-600 hover:text-primary-700 mt-0.5">
                        {fullName(order.patient)}
                      </button>
                      <p className="text-xs text-surface-400 mt-0.5">{order.lab?.name || 'نامشخص'} • {formatDate(order.order_date)}</p>
                      {order.tooth_numbers && <p className="text-xs text-surface-400">دندان‌ها: {order.tooth_numbers}</p>}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-surface-800 text-sm">{formatCurrency(order.price)}</p>
                      <StatusBadge status={statusStyle(labOrderStatus, order.status, 'pending')} showIcon className="mt-1" />
                    </div>
                  </div>
                  {step && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-100">
                      <button onClick={() => advanceOrder(order)} className="btn-ghost text-xs">{step.action}</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : tab === 'labs' ? (
        labs.length === 0 ? (
          <EmptyState icon={FlaskConical} title="هیچ لابراتواری" description="لابراتوار جدید ثبت کنید" action={<button onClick={() => setShowLabForm(true)} className="btn-primary"><Plus size={18} />لابراتوار جدید</button>} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {labs.map((lab, i) => (
              <div key={lab.id} className="card card-hover p-5 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-start gap-3">
                  <Avatar tone="secondary" className="w-12 h-12 rounded-xl shrink-0">{lab.name.charAt(0)}</Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-surface-800 text-sm truncate">{lab.name}</h3>
                    {lab.contact_person && <p className="text-xs text-surface-400 mt-0.5">{lab.contact_person}</p>}
                  </div>
                </div>
                <div className="space-y-1.5 mt-3 pt-3 border-t border-surface-100">
                  {lab.phone && <p className="flex items-center gap-2 text-xs text-surface-500"><Phone size={12} /> {lab.phone}</p>}
                  {lab.email && <p className="flex items-center gap-2 text-xs text-surface-500"><Mail size={12} /> {lab.email}</p>}
                  {lab.address && <p className="flex items-center gap-2 text-xs text-surface-500"><MapPin size={12} /> {lab.address}</p>}
                </div>
                {lab.balance > 0 && (
                  <div className="mt-3 px-3 py-2 bg-error-50 rounded-xl">
                    <p className="text-xs text-error-600 font-medium">بدهی: {formatCurrency(lab.balance)}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => { setSelectedLab(lab); setShowPaymentForm(true); }} className="btn-secondary text-xs flex-1">
                    <DollarSign size={14} />
                    ثبت پرداخت
                  </button>
                  <button onClick={() => { setSelectedLab(lab); setShowOrderForm(true); }} className="btn-ghost text-xs">
                    <Plus size={14} />
                    سفارش
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        labPayments.length === 0 ? (
          <EmptyState icon={DollarSign} title="هیچ پرداختی" description="پرداخت به لابراتوارها اینجا ثبت می‌شود" />
        ) : (
          <div className="space-y-3">
            {labPayments.map((pay, i) => (
              <div key={pay.id} className="card p-4 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center shrink-0">
                    <DollarSign size={18} className="text-accent-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-800 text-sm">{formatCurrency(pay.amount)}</p>
                    <p className="text-xs text-surface-400 mt-0.5">{pay.lab?.name || 'نامشخص'} • {formatDate(pay.payment_date)}</p>
                  </div>
                  <span className="badge bg-surface-100 text-surface-500">{paymentMethodLabel(pay.payment_method)}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {showLabForm && (
        <LabForm onClose={() => setShowLabForm(false)} onSaved={() => { load(); setShowLabForm(false); }} />
      )}
      {showOrderForm && (
        <LabOrderForm
          labs={labs}
          patients={patients}
          preselectedLab={selectedLab}
          onClose={() => { setShowOrderForm(false); setSelectedLab(null); }}
          onSaved={() => { load(); setShowOrderForm(false); setSelectedLab(null); }}
        />
      )}
      {showPaymentForm && selectedLab && (
        <LabPaymentForm
          lab={selectedLab}
          onClose={() => { setShowPaymentForm(false); setSelectedLab(null); }}
          onSaved={() => { load(); setShowPaymentForm(false); setSelectedLab(null); }}
        />
      )}
    </div>
  );
}
