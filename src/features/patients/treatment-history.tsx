import { useState, useEffect, useCallback } from 'react';
import { Calendar, FileText, Plus, Smile } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, todayISO } from '@/lib/date';
import { formatCurrency, formatNumber } from '@/lib/format';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { Service, Treatment } from '@/lib/types';

export function TreatmentHistory({ patientId }: { patientId: string }) {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ service_id: '', tooth_number: '', description: '', cost: '', notes: '' });

  const load = useCallback(() => {
    const rows = db.orderBy(db.list('treatments', (t) => t.patient_id === patientId), 'created_at', { ascending: false });
    setTreatments(db.withOne(db.withOne(rows, 'service', 'services', 'service_id'), 'staff', 'staff', 'staff_id'));
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    load();
    setServices(db.list('services', (s) => s.active));
  }, [load]);

  function addTreatment() {
    const svc = services.find((s) => s.id === form.service_id);
    db.insert('treatments', {
      patient_id: patientId,
      service_id: form.service_id || null,
      tooth_number: form.tooth_number ? parseInt(form.tooth_number) : null,
      description: form.description || null,
      cost: form.cost ? parseFloat(form.cost) : svc?.default_price || 0,
      notes: form.notes || null,
      treatment_date: todayISO(),
      status: 'completed',
    });
    showToast('درمان ثبت شد');
    setForm({ service_id: '', tooth_number: '', description: '', cost: '', notes: '' });
    setShowAdd(false);
    load();
  }

  if (loading) return <Skeleton className="h-32" variant="inset" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-500">{formatNumber(treatments.length)} درمان ثبت شده</p>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary">
          <Plus size={16} />
          افزودن درمان
        </button>
      </div>

      {showAdd && (
        <div className="p-4 bg-surface-50 rounded-xl space-y-3 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label-field">خدمت</label>
              <select className="input-field" value={form.service_id} onChange={(e) => {
                const svc = services.find((s) => s.id === e.target.value);
                setForm({ ...form, service_id: e.target.value, cost: svc ? String(svc.default_price) : form.cost });
              }}>
                <option value="">انتخاب خدمت</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name} - {formatCurrency(s.default_price)}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">شماره دندان</label>
              <input type="number" className="input-field" value={form.tooth_number} onChange={(e) => setForm({ ...form, tooth_number: e.target.value })} />
            </div>
            <div>
              <label className="label-field">هزینه (تومان)</label>
              <input type="number" className="input-field" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </div>
            <div>
              <label className="label-field">توضیحات</label>
              <input className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label-field">یادداشت</label>
            <textarea className="input-field min-h-[60px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={addTreatment} className="btn-primary">ثبت درمان</button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary">انصراف</button>
          </div>
        </div>
      )}

      {treatments.length === 0 ? (
        <EmptyState icon={Calendar} title="هیچ درمانی ثبت نشده" />
      ) : (
        <div className="space-y-2">
          {treatments.map((t) => (
            <div key={t.id} className="flex items-start gap-3 p-4 bg-surface-50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0">
                {t.tooth_number ? <Smile size={18} className="text-primary-500" /> : <FileText size={18} className="text-surface-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-surface-800 text-sm">
                  {t.service?.name || t.description || 'درمان'}
                  {t.tooth_number && <span className="text-surface-400"> • دندان {formatNumber(t.tooth_number)}</span>}
                </p>
                <p className="text-xs text-surface-400 mt-0.5">
                  {formatDate(t.treatment_date)} • {formatCurrency(t.cost)}
                </p>
                {t.notes && <p className="text-xs text-surface-500 mt-1">{t.notes}</p>}
              </div>
              <span className="badge bg-accent-50 text-accent-600">تکمیل شده</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
