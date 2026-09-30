import { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical,
  Plus,
  Phone,
  Mail,
  MapPin,
  X,
  DollarSign,
  Package,
  CheckCircle2,
  Clock,
  Truck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, formatNumber, getInitials } from '@/lib/format';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/Toast';
import type { Lab, LabOrder, LabService, Patient, Staff, PageKey } from '@/lib/types';

interface LabProps {
  onNavigate: (page: PageKey) => void;
  onOpenPatient: (patientId: string) => void;
}

type TabKey = 'orders' | 'labs' | 'payments';

export function Lab({ onOpenPatient }: LabProps) {
  const [tab, setTab] = useState<TabKey>('orders');
  const [labs, setLabs] = useState<Lab[]>([]);
  const [orders, setOrders] = useState<(LabOrder & { lab?: Lab; patient?: Patient })[]>([]);
  const [labPayments, setLabPayments] = useState<any[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLabForm, setShowLabForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [labsRes, ordersRes, payRes, patRes, stfRes] = await Promise.all([
      supabase.from('labs').select('*').order('name'),
      supabase.from('lab_orders').select('*, lab:labs(*), patient:patients(*)').order('created_at', { ascending: false }),
      supabase.from('lab_payments').select('*, lab:labs(*)').order('payment_date', { ascending: false }),
      supabase.from('patients').select('*').order('first_name'),
      supabase.from('staff').select('*').eq('active', true),
    ]);
    setLabs(labsRes.data || []);
    setOrders(ordersRes.data || []);
    setLabPayments(payRes.data || []);
    setPatients(patRes.data || []);
    setStaffList(stfRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalLabDebt = labs.reduce((s, l) => s + l.balance, 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'in_progress').length;
  const totalLabCost = orders.reduce((s, o) => s + o.price, 0);

  const statusConfig: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    pending: { label: 'در انتظار', bg: 'bg-warning-50', text: 'text-warning-600', icon: <Clock size={12} /> },
    in_progress: { label: 'در حال ساخت', bg: 'bg-secondary-50', text: 'text-secondary-600', icon: <Clock size={12} /> },
    ready: { label: 'آماده', bg: 'bg-accent-50', text: 'text-accent-600', icon: <CheckCircle2 size={12} /> },
    delivered: { label: 'تحویل شده', bg: 'bg-surface-100', text: 'text-surface-500', icon: <Truck size={12} /> },
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'orders', label: 'سفارشات', icon: <Package size={16} /> },
    { key: 'labs', label: 'لابراتوارها', icon: <FlaskConical size={16} /> },
    { key: 'payments', label: 'پرداخت‌ها', icon: <DollarSign size={16} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-surface-800">لابراتوار</h1>
          <p className="text-sm text-surface-400 mt-1">مدیریت سفارشات و پرداخت‌های لابراتوار</p>
        </div>
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
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card animate-slide-up">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-surface-500 mb-2">لابراتوارها</p>
              <p className="text-2xl font-bold text-surface-800">{formatNumber(labs.length)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center">
              <FlaskConical size={18} className="text-secondary-500" />
            </div>
          </div>
        </div>
        <div className="stat-card animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-surface-500 mb-2">سفارشات در انتظار</p>
              <p className="text-2xl font-bold text-warning-600">{formatNumber(pendingOrders)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center">
              <Clock size={18} className="text-warning-500" />
            </div>
          </div>
        </div>
        <div className="stat-card animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-surface-500 mb-2">هزینه کل لابراتوار</p>
              <p className="text-lg font-bold text-surface-800">{formatCurrency(totalLabCost)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <DollarSign size={18} className="text-primary-500" />
            </div>
          </div>
        </div>
        <div className="stat-card animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-surface-500 mb-2">بدهی به لابراتوارها</p>
              <p className="text-lg font-bold text-error-600">{formatCurrency(totalLabDebt)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-error-50 flex items-center justify-center">
              <DollarSign size={18} className="text-error-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-surface-100">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              tab === t.key ? 'border-primary-500 text-primary-600' : 'border-transparent text-surface-400 hover:text-surface-600'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-surface-100 animate-pulse-soft" />
          ))}
        </div>
      ) : tab === 'orders' ? (
        orders.length === 0 ? (
          <EmptyState icon={Package} title="هیچ سفارشی" description="سفارش لابراتوار جدید ثبت کنید" action={<button onClick={() => setShowOrderForm(true)} className="btn-primary"><Plus size={18} />سفارش جدید</button>} />
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const sc = statusConfig[order.status] || statusConfig.pending;
              return (
                <div key={order.id} className="card card-hover p-4 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-secondary-50 flex items-center justify-center shrink-0">
                      <FlaskConical size={20} className="text-secondary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-surface-800 text-sm">{order.service_name}</p>
                      <button onClick={() => onOpenPatient(order.patient_id)} className="text-xs text-primary-600 hover:text-primary-700 mt-0.5">
                        {order.patient ? `${order.patient.first_name} ${order.patient.last_name}` : 'نامشخص'}
                      </button>
                      <p className="text-xs text-surface-400 mt-0.5">{order.lab?.name || 'نامشخص'} • {formatDate(order.order_date)}</p>
                      {order.tooth_numbers && <p className="text-xs text-surface-400">دندان‌ها: {order.tooth_numbers}</p>}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-surface-800 text-sm">{formatCurrency(order.price)}</p>
                      <span className={`badge ${sc.bg} ${sc.text} mt-1`}>{sc.icon}{sc.label}</span>
                    </div>
                  </div>
                  {order.status !== 'delivered' && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-100">
                      {order.status === 'pending' && (
                        <button onClick={async () => { await supabase.from('lab_orders').update({ status: 'in_progress' }).eq('id', order.id); showToast('وضعیت بروزرسانی شد'); load(); }} className="btn-ghost text-xs">شروع ساخت</button>
                      )}
                      {order.status === 'in_progress' && (
                        <button onClick={async () => { await supabase.from('lab_orders').update({ status: 'ready' }).eq('id', order.id); showToast('وضعیت بروزرسانی شد'); load(); }} className="btn-ghost text-xs">آماده شد</button>
                      )}
                      {order.status === 'ready' && (
                        <button onClick={async () => { await supabase.from('lab_orders').update({ status: 'delivered', delivered_date: new Date().toISOString().split('T')[0] }).eq('id', order.id); showToast('تحویل داده شد'); load(); }} className="btn-ghost text-xs">تحویل به بیمار</button>
                      )}
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
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-100 to-secondary-50 flex items-center justify-center text-secondary-700 font-bold shrink-0">
                    {lab.name.charAt(0)}
                  </div>
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
                  <span className="badge bg-surface-100 text-surface-500">{pay.payment_method}</span>
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
        <OrderForm
          labs={labs}
          patients={patients}
          staffList={staffList}
          preselectedLab={selectedLab}
          onClose={() => { setShowOrderForm(false); setSelectedLab(null); }}
          onSaved={() => { load(); setShowOrderForm(false); setSelectedLab(null); }}
        />
      )}
      {showPaymentForm && selectedLab && (
        <PaymentForm
          lab={selectedLab}
          onClose={() => { setShowPaymentForm(false); setSelectedLab(null); }}
          onSaved={() => { load(); setShowPaymentForm(false); setSelectedLab(null); }}
        />
      )}
    </div>
  );
}

function LabForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.name) { showToast('نام لابراتوار الزامی است', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('labs').insert(form);
    if (error) showToast('خطا در ثبت', 'error');
    else { showToast('لابراتوار ثبت شد'); onSaved(); }
    setSaving(false);
  }

  return (
    <Modal open onClose={onClose} title="لابراتوار جدید" size="md">
      <div className="space-y-4">
        <div>
          <label className="label-field">نام *</label>
          <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">مسئول</label>
            <input className="input-field" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
          </div>
          <div>
            <label className="label-field">تلفن</label>
            <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label-field">ایمیل</label>
          <input className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label-field">آدرس</label>
          <input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'در حال ثبت...' : 'ثبت'}</button>
          <button onClick={onClose} className="btn-secondary">انصراف</button>
        </div>
      </div>
    </Modal>
  );
}

function OrderForm({ labs, patients, staffList, preselectedLab, onClose, onSaved }: {
  labs: Lab[];
  patients: Patient[];
  staffList: Staff[];
  preselectedLab: Lab | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    lab_id: preselectedLab?.id || '',
    patient_id: '',
    staff_id: '',
    service_name: '',
    tooth_numbers: '',
    price: 0,
    due_date: '',
    notes: '',
  });
  const [labServices, setLabServices] = useState<LabService[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (form.lab_id) {
      supabase.from('lab_services').select('*').eq('lab_id', form.lab_id).then(({ data }) => setLabServices(data || []));
    }
  }, [form.lab_id]);

  async function save() {
    if (!form.lab_id || !form.patient_id || !form.service_name) { showToast('لابراتوار، بیمار و خدمت الزامی است', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('lab_orders').insert({
      lab_id: form.lab_id,
      patient_id: form.patient_id,
      staff_id: form.staff_id || null,
      service_name: form.service_name,
      tooth_numbers: form.tooth_numbers || null,
      description: form.notes || null,
      price: form.price,
      status: 'pending',
      order_date: new Date().toISOString().split('T')[0],
      due_date: form.due_date || null,
      notes: form.notes || null,
    });
    if (error) showToast('خطا در ثبت سفارش', 'error');
    else { showToast('سفارش ثبت شد'); onSaved(); }
    setSaving(false);
  }

  return (
    <Modal open onClose={onClose} title="سفارش لابراتوار" size="md">
      <div className="space-y-4">
        <div>
          <label className="label-field">لابراتوار *</label>
          <select className="input-field" value={form.lab_id} onChange={(e) => setForm({ ...form, lab_id: e.target.value })}>
            <option value="">انتخاب</option>
            {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label-field">بیمار *</label>
          <select className="input-field" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
            <option value="">انتخاب</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} - {p.phone}</option>)}
          </select>
        </div>
        <div>
          <label className="label-field">نوع خدمت *</label>
          {labServices.length > 0 ? (
            <select
              className="input-field"
              value={form.service_name}
              onChange={(e) => {
                const svc = labServices.find((s) => s.name === e.target.value);
                setForm({ ...form, service_name: e.target.value, price: svc?.price || form.price });
              }}
            >
              <option value="">انتخاب</option>
              {labServices.map((s) => <option key={s.id} value={s.name}>{s.name} - {formatCurrency(s.price)}</option>)}
            </select>
          ) : (
            <input className="input-field" value={form.service_name} onChange={(e) => setForm({ ...form, service_name: e.target.value })} placeholder="نام خدمت" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">شماره دندان‌ها</label>
            <input className="input-field" value={form.tooth_numbers} onChange={(e) => setForm({ ...form, tooth_numbers: e.target.value })} placeholder="مثلا: ۱۸، ۱۹" />
          </div>
          <div>
            <label className="label-field">موعد تحویل</label>
            <input type="date" className="input-field" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label-field">هزینه (تومان)</label>
          <input type="number" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
        </div>
        <div>
          <label className="label-field">یادداشت</label>
          <textarea className="input-field min-h-[60px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'در حال ثبت...' : 'ثبت سفارش'}</button>
          <button onClick={onClose} className="btn-secondary">انصراف</button>
        </div>
      </div>
    </Modal>
  );
}

function PaymentForm({ lab, onClose, onSaved }: { lab: Lab; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState('cash');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (amount <= 0) { showToast('مبلغ را وارد کنید', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('lab_payments').insert({
      lab_id: lab.id,
      amount,
      payment_method: method,
      payment_date: new Date().toISOString().split('T')[0],
    });
    if (error) { showToast('خطا در ثبت', 'error'); setSaving(false); return; }

    await supabase.from('labs').update({ balance: Math.max(0, lab.balance - amount) }).eq('id', lab.id);
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
          <input type="number" className="input-field" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label className="label-field">روش پرداخت</label>
          <div className="flex items-center gap-2">
            {(['cash', 'card', 'transfer'] as const).map((m) => (
              <button key={m} onClick={() => setMethod(m)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${method === m ? 'bg-primary-50 text-primary-600 border border-primary-200' : 'bg-surface-50 text-surface-400 border border-surface-100'}`}>
                {m === 'cash' ? 'نقدی' : m === 'card' ? 'کارت' : 'انتقال'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'در حال ثبت...' : 'ثبت پرداخت'}</button>
          <button onClick={onClose} className="btn-secondary">انصراف</button>
        </div>
      </div>
    </Modal>
  );
}
