import { useState, useEffect } from 'react';
import { JalaliDateInput } from '@/components/ui/jalali-date-input';
import { Modal } from '@/components/ui/modal';
import { todayISO } from '@/lib/date';
import { formatCurrency } from '@/lib/format';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { Lab, LabService, Patient } from '@/lib/types';

export function LabOrderForm({ labs, patients, preselectedLab, onClose, onSaved }: {
  labs: Lab[];
  patients: Patient[];
  preselectedLab: Lab | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    lab_id: preselectedLab?.id || '',
    patient_id: '',
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
      setLabServices(db.list('lab_services', (s) => s.lab_id === form.lab_id));
    }
  }, [form.lab_id]);

  function save() {
    if (!form.lab_id || !form.patient_id || !form.service_name) { showToast('لابراتوار، بیمار و خدمت الزامی است', 'error'); return; }
    setSaving(true);
    db.insert('lab_orders', {
      lab_id: form.lab_id,
      patient_id: form.patient_id,
      service_name: form.service_name,
      tooth_numbers: form.tooth_numbers || null,
      description: form.notes || null,
      price: form.price,
      status: 'pending',
      order_date: todayISO(),
      due_date: form.due_date || null,
      notes: form.notes || null,
    });
    showToast('سفارش ثبت شد');
    onSaved();
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
            <JalaliDateInput value={form.due_date} onChange={(due_date) => setForm({ ...form, due_date })} />
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
