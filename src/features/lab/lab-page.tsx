import { useState, useEffect, useCallback, useMemo } from 'react';
import { FlaskConical, Package, Plus, Wallet } from 'lucide-react';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, type TabItem } from '@/components/ui/tabs';
import { labOrderStatus, statusStyle } from '@/constants/status';
import { formatDateNumeric, todayISO } from '@/lib/date';
import { formatCurrency, formatNumber, fullName, paymentMethodLabel } from '@/lib/format';
import { usePatients } from '@/data/patients';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { Lab as LabRow, LabOrder, LabPayment, LabService } from '@/lib/types';
import { LabForm } from './lab-form';
import { LabOrderForm } from './lab-order-form';
import { LabPaymentForm } from './lab-payment-form';

interface LabProps {
  onOpenPatient: (patientId: string) => void;
}

type LabTab = 'orders' | 'labs' | 'payments';

const tabs: TabItem<LabTab>[] = [
  { key: 'orders', label: 'سفارشات' },
  { key: 'labs', label: 'لابراتوارها' },
  { key: 'payments', label: 'پرداخت‌ها' },
];

type OrderFilter = 'all' | LabOrder['status'];

const orderFilters: { value: OrderFilter; label: string }[] = [
  { value: 'all', label: 'همه' },
  ...(['pending', 'in_progress', 'ready', 'delivered'] as const).map((value) => ({ value, label: labOrderStatus[value].label })),
];

/** The next step for an order in each status: its button and the toast shown after taking it. */
const nextStep: Partial<Record<LabOrder['status'], { to: LabOrder['status']; action: string; toast: string; className: string }>> = {
  pending: { to: 'in_progress', action: 'شروع ساخت', toast: 'وضعیت بروزرسانی شد', className: 'bg-secondary-50 text-secondary-700 border-secondary-200 hover:bg-secondary-100' },
  in_progress: { to: 'ready', action: 'آماده تحویل', toast: 'وضعیت بروزرسانی شد', className: 'bg-warning-50 text-warning-700 border-warning-200 hover:bg-warning-100' },
  ready: { to: 'delivered', action: 'تحویل گرفته شد', toast: 'تحویل داده شد', className: 'bg-accent-50 text-accent-700 border-accent-200 hover:bg-accent-100' },
};

export function Lab({ onOpenPatient }: LabProps) {
  const [tab, setTab] = useState<LabTab>('orders');
  const [statusFilter, setStatusFilter] = useState<OrderFilter>('all');
  const [labs, setLabs] = useState<LabRow[]>([]);
  const [labServices, setLabServices] = useState<LabService[]>([]);
  const [orderRows, setOrderRows] = useState<LabOrder[]>([]);
  const [labPayments, setLabPayments] = useState<(LabPayment & { lab?: LabRow })[]>([]);
  const { data: allPatients = [] } = usePatients();
  const patients = useMemo(() => [...allPatients].sort((a, b) => a.first_name.localeCompare(b.first_name, 'fa')), [allPatients]);
  const orders = useMemo(() => db.joinOne(orderRows, 'patient', allPatients, 'patient_id'), [orderRows, allPatients]);
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
    setLabServices(db.list('lab_services'));
    setOrderRows(db.withOne(orderRows, 'lab', 'labs', 'lab_id'));
    setLabPayments(db.withOne(paymentRows, 'lab', 'labs', 'lab_id'));
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

  const filteredOrders = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);

  return (
    <div className="space-y-5">
      <PageHeader title="لابراتوار" subtitle={<>{formatNumber(orders.length)} سفارش</>}>
        <button onClick={() => setShowLabForm(true)} className="btn-secondary">+ لابراتوار جدید</button>
        <button onClick={() => setShowOrderForm(true)} className="btn-primary">
          <Plus size={16} />
          سفارش جدید
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="کل سفارشات" value={formatNumber(orders.length)} valueClassName="text-surface-700" />
        <StatTile label="در حال انجام" value={formatNumber(pendingOrders)} valueClassName="text-secondary-600" />
        <StatTile label="هزینه کل" value={formatCurrency(totalLabCost)} valueClassName="text-surface-700" />
        <StatTile label="بدهی کل" value={formatCurrency(totalLabDebt)} valueClassName="text-error-600" />
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} fit />

      {loading ? (
        <div className="space-y-3">
          <SkeletonList count={3} className="h-24" />
        </div>
      ) : tab === 'orders' ? (
        <div className="space-y-4">
          <ChoiceChips options={orderFilters} value={statusFilter} onChange={setStatusFilter} />
          {filteredOrders.length === 0 ? (
            <EmptyState icon={Package} title="سفارشی یافت نشد" description="سفارش لابراتوار جدید ثبت کنید" action={<button onClick={() => setShowOrderForm(true)} className="btn-primary"><Plus size={16} />سفارش جدید</button>} />
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const step = nextStep[order.status];
                return (
                  <div key={order.id} className="card p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <button onClick={() => onOpenPatient(order.patient_id)} className="text-sm font-semibold text-surface-800 hover:text-primary-600 transition-colors">
                            {fullName(order.patient)}
                          </button>
                          {order.tooth_numbers && <span className="text-xs bg-surface-100 text-surface-600 px-1.5 py-0.5 rounded-sm">دندان {order.tooth_numbers}</span>}
                        </div>
                        <p className="text-xs text-surface-600 mb-1">{order.service_name} · {order.lab?.name || 'نامشخص'}</p>
                        <div className="flex flex-wrap gap-x-3 text-xs text-surface-400">
                          <span>ثبت: {formatDateNumeric(order.order_date)}</span>
                          {order.due_date && <span>تحویل: {formatDateNumeric(order.due_date)}</span>}
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        <p className="text-sm font-bold text-surface-800 mb-1">{formatCurrency(order.price)}</p>
                        <StatusBadge status={statusStyle(labOrderStatus, order.status, 'pending')} />
                      </div>
                    </div>
                    {step && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-surface-100">
                        <button onClick={() => advanceOrder(order)} className={`btn-chip ${step.className}`}>{step.action}</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : tab === 'labs' ? (
        labs.length === 0 ? (
          <EmptyState icon={FlaskConical} title="لابراتواری ثبت نشده" description="لابراتوار جدید ثبت کنید" action={<button onClick={() => setShowLabForm(true)} className="btn-primary"><Plus size={16} />لابراتوار جدید</button>} />
        ) : (
          <div className="space-y-3">
            {labs.map((lab) => {
              const services = labServices.filter((svc) => svc.lab_id === lab.id);
              return (
                <div key={lab.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-surface-800">{lab.name}</h3>
                      <p className="text-xs text-surface-500 mt-0.5">{[lab.phone, lab.contact_person, lab.email].filter(Boolean).join(' · ')}</p>
                      {lab.address && <p className="text-xs text-surface-400">{lab.address}</p>}
                    </div>
                    <div className="text-left shrink-0">
                      {lab.balance > 0 ? (
                        <>
                          <p className="text-xs text-surface-400">بدهی به لابراتوار</p>
                          <p className="text-base font-bold text-error-600">{formatCurrency(lab.balance)}</p>
                        </>
                      ) : (
                        <span className="badge border bg-accent-50 text-accent-700 border-accent-200">تسویه شده</span>
                      )}
                    </div>
                  </div>
                  {services.length > 0 && (
                    <div className="pt-3 border-t border-surface-100">
                      <p className="text-xs font-medium text-surface-600 mb-2">خدمات:</p>
                      <div className="flex flex-wrap gap-2">
                        {services.map((svc) => (
                          <span key={svc.id} className="text-xs bg-surface-50 border border-surface-200 text-surface-600 px-2 py-1 rounded-lg">{svc.name} - {formatCurrency(svc.price)}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-surface-100">
                    <button onClick={() => { setSelectedLab(lab); setShowPaymentForm(true); }} className="btn-chip bg-accent-600 border-accent-600 text-white hover:bg-accent-700">
                      {lab.balance > 0 ? 'تسویه / ثبت پرداخت' : 'ثبت پرداخت'}
                    </button>
                    <button onClick={() => { setSelectedLab(lab); setShowOrderForm(true); }} className="btn-chip bg-white border-surface-200 text-surface-600 hover:bg-surface-50">
                      <Plus size={12} />
                      سفارش
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : labPayments.length === 0 ? (
        <EmptyState icon={Wallet} title="پرداختی ثبت نشده" description="پرداخت به لابراتوارها اینجا ثبت می‌شود" />
      ) : (
        <div className="card p-5">
          <SectionHeader title="پرداخت‌ها به لابراتوارها" note={formatCurrency(labPayments.reduce((sum, p) => sum + p.amount, 0))} className="mb-3" />
          <div className="space-y-1">
            {labPayments.map((pay) => (
              <div key={pay.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-50 text-sm">
                <span className="text-surface-400 text-xs w-20 shrink-0">{formatDateNumeric(pay.payment_date)}</span>
                <span className="text-surface-700 flex-1 min-w-0 truncate">{pay.lab?.name || 'نامشخص'}</span>
                <span className="text-xs bg-surface-100 text-surface-600 px-1.5 py-0.5 rounded-sm">{paymentMethodLabel(pay.payment_method)}</span>
                <span className="font-semibold text-surface-800">{formatCurrency(pay.amount)}</span>
              </div>
            ))}
          </div>
        </div>
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
