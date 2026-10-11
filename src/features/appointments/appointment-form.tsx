import { useState } from 'react';
import { JalaliDateInput } from '@/components/ui/jalali-date-input';
import { Modal } from '@/components/ui/modal';
import { formatCurrency } from '@/lib/format';
import { addMinutes } from '@/lib/schedule';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { Patient, Service, Staff } from '@/lib/types';

interface AppointmentFormProps {
  /** The day to prefill, `YYYY-MM-DD`. */
  date: string;
  /** Start time to prefill, `HH:MM`. */
  startTime: string;
  patients: Patient[];
  services: Service[];
  staffList: Staff[];
  onClose: () => void;
  onSaved: () => void;
}

export function AppointmentForm({ date, startTime, patients, services, staffList, onClose, onSaved }: AppointmentFormProps) {
  const [form, setForm] = useState({
    patient_id: '',
    appointment_date: date,
    service_id: '',
    staff_id: '',
    start_time: startTime,
    end_time: addMinutes(startTime, 30),
    notes: '',
    price: 0,
  });

  const durationOf = (serviceId: string) => services.find((s) => s.id === serviceId)?.duration_minutes || 30;

  function save() {
    if (!form.patient_id || !form.service_id || !form.appointment_date) { showToast('بیمار، خدمت و تاریخ را انتخاب کنید', 'error'); return; }
    db.insert('appointments', {
      patient_id: form.patient_id,
      service_id: form.service_id,
      staff_id: form.staff_id || null,
      appointment_date: form.appointment_date,
      start_time: form.start_time,
      end_time: form.end_time,
      notes: form.notes || null,
      price: form.price,
      status: 'pending',
    });
    showToast('نوبت ثبت شد');
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="ثبت نوبت جدید" size="md">
      <div className="space-y-3">
        <div>
          <label className="label-field">بیمار *</label>
          <select className="input-field" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
            <option value="">انتخاب بیمار</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} - {p.phone}</option>)}
          </select>
        </div>
        <div>
          <label className="label-field">خدمت *</label>
          <select
            className="input-field"
            value={form.service_id}
            onChange={(e) => {
              const svc = services.find((s) => s.id === e.target.value);
              setForm({
                ...form,
                service_id: e.target.value,
                price: svc?.default_price || 0,
                end_time: addMinutes(form.start_time, svc?.duration_minutes || 30),
              });
            }}
          >
            <option value="">انتخاب خدمت</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name} - {formatCurrency(s.default_price)}</option>)}
          </select>
        </div>
        <div>
          <label className="label-field">دندانپزشک</label>
          <select className="input-field" value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })}>
            <option value="">انتخاب دکتر</option>
            {staffList.filter((s) => s.role === 'dentist').map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2">
            <label className="label-field">تاریخ *</label>
            <JalaliDateInput value={form.appointment_date} onChange={(appointment_date) => setForm({ ...form, appointment_date })} clearable={false} />
          </div>
          <div>
            <label className="label-field">ساعت شروع</label>
            <input
              type="time"
              className="input-field"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value, end_time: addMinutes(e.target.value, durationOf(form.service_id)) })}
            />
          </div>
          <div>
            <label className="label-field">ساعت پایان</label>
            <input type="time" className="input-field" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label-field">مبلغ (تومان)</label>
          <input type="number" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
        </div>
        <div>
          <label className="label-field">یادداشت</label>
          <textarea className="input-field min-h-[60px] resize-none" placeholder="توضیحات اضافی..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button onClick={save} className="btn-primary flex-1 py-2.5">ثبت نوبت</button>
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5">انصراف</button>
        </div>
      </div>
    </Modal>
  );
}
