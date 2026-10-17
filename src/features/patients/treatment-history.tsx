import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateNumeric, todayISO } from '@/lib/date';
import { formatCurrency, formatNumber } from '@/lib/format';
import { useServices } from '@/data/services';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { Treatment } from '@/lib/types';

export function TreatmentHistory({ patientId }: { patientId: string }) {
  const [treatmentRows, setTreatmentRows] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: allServices = [] } = useServices();
  const services = allServices.filter((s) => s.active);
  const treatments = db.joinOne(treatmentRows, 'service', allServices, 'service_id');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ service_id: '', tooth_number: '', description: '', cost: '', notes: '' });

  const load = useCallback(() => {
    const rows = db.orderBy(db.list('treatments', (t) => t.patient_id === patientId), 'created_at', { ascending: false });
    setTreatmentRows(db.withOne(rows, 'staff', 'staff', 'staff_id'));
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    load();
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

  if (loading) return <Skeleton className="h-32" />;

  return (
    <div className="card p-5">
      <SectionHeader
        title={`درمان‌های انجام‌شده (${formatNumber(treatments.length)})`}
        className="mb-3"
        aside={
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-xs px-3 py-1.5">
            <Plus size={14} />
            افزودن درمان
          </button>
        }
      />

      {showAdd && (
        <div className="p-4 mb-3 bg-surface-50 rounded-xl space-y-3">
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
            <textarea className="input-field min-h-[60px] resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={addTreatment} className="btn-primary">ثبت درمان</button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary">انصراف</button>
          </div>
        </div>
      )}

      {treatments.length === 0 ? (
        <p className="text-xs text-surface-400">درمانی ثبت نشده است</p>
      ) : (
        <div className="space-y-1">
          {treatments.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-50 text-sm">
              <span className="text-surface-400 text-xs w-20 shrink-0">{formatDateNumeric(t.treatment_date)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-surface-700 truncate">
                  {t.service?.name || t.description || 'درمان'}
                  {t.tooth_number && <span className="text-surface-400"> (دندان {formatNumber(t.tooth_number)})</span>}
                </p>
                {t.notes && <p className="text-xs text-surface-400 truncate">{t.notes}</p>}
              </div>
              <span className="font-semibold text-surface-800 text-xs sm:text-sm">{formatCurrency(t.cost)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
