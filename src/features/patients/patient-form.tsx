import { useState } from 'react';
import { JalaliDateInput } from '@/components/ui/jalali-date-input';
import { Modal } from '@/components/ui/modal';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { Patient } from '@/lib/types';

export function PatientForm({ patient, onClose, onSaved }: {
  patient: Patient | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    first_name: patient?.first_name || '',
    last_name: patient?.last_name || '',
    phone: patient?.phone || '',
    national_id: patient?.national_id || '',
    birth_date: patient?.birth_date || '',
    gender: patient?.gender || 'male',
    email: patient?.email || '',
    address: patient?.address || '',
    blood_type: patient?.blood_type || '',
    allergies: patient?.allergies || '',
    medical_history: patient?.medical_history || '',
    emergency_contact: patient?.emergency_contact || '',
    emergency_phone: patient?.emergency_phone || '',
    insurance_company: patient?.insurance_company || '',
    insurance_number: patient?.insurance_number || '',
    notes: patient?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  function handleSave() {
    if (!form.first_name || !form.last_name || !form.phone) {
      showToast('نام، نام خانوادگی و تلفن الزامی است', 'error');
      return;
    }
    setSaving(true);
    // Optional fields left blank are stored as null, not ''.
    const values = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value === '' ? null : value]),
    ) as unknown as db.Patch<'patients'>;
    if (patient) {
      db.update('patients', patient.id, values);
      showToast('بیمار بروزرسانی شد');
    } else {
      db.insert('patients', values);
      showToast('بیمار جدید ثبت شد');
    }
    onSaved();
    setSaving(false);
  }

  return (
    <Modal open onClose={onClose} title={patient ? 'ویرایش بیمار' : 'بیمار جدید'} size="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-field">نام *</label>
            <input className="input-field" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div>
            <label className="label-field">نام خانوادگی *</label>
            <input className="input-field" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
          <div>
            <label className="label-field">تلفن *</label>
            <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label-field">کد ملی</label>
            <input className="input-field" value={form.national_id} onChange={(e) => setForm({ ...form, national_id: e.target.value })} />
          </div>
          <div>
            <label className="label-field">تاریخ تولد</label>
            <JalaliDateInput value={form.birth_date} onChange={(birth_date) => setForm({ ...form, birth_date })} />
          </div>
          <div>
            <label className="label-field">جنسیت</label>
            <select className="input-field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="male">آقا</option>
              <option value="female">خانم</option>
            </select>
          </div>
          <div>
            <label className="label-field">ایمیل</label>
            <input className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label-field">گروه خونی</label>
            <select className="input-field" value={form.blood_type} onChange={(e) => setForm({ ...form, blood_type: e.target.value })}>
              <option value="">نامشخص</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label-field">آدرس</label>
          <input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>

        <div className="border-t border-surface-100 pt-4">
          <h4 className="font-semibold text-surface-700 text-sm mb-3">اطلاعات پزشکی</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">آلرژی‌ها</label>
              <input className="input-field" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="مثلا: پنی‌سیلین" />
            </div>
            <div>
              <label className="label-field">بیماری‌های زمینه‌ای</label>
              <input className="input-field" value={form.medical_history} onChange={(e) => setForm({ ...form, medical_history: e.target.value })} placeholder="مثلا: دیابت" />
            </div>
            <div>
              <label className="label-field">تماس اضطراری</label>
              <input className="input-field" value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} />
            </div>
            <div>
              <label className="label-field">تلفن اضطراری</label>
              <input className="input-field" value={form.emergency_phone} onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="border-t border-surface-100 pt-4">
          <h4 className="font-semibold text-surface-700 text-sm mb-3">اطلاعات بیمه</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">شرکت بیمه</label>
              <input className="input-field" value={form.insurance_company} onChange={(e) => setForm({ ...form, insurance_company: e.target.value })} />
            </div>
            <div>
              <label className="label-field">شماره بیمه</label>
              <input className="input-field" value={form.insurance_number} onChange={(e) => setForm({ ...form, insurance_number: e.target.value })} />
            </div>
          </div>
        </div>

        <div>
          <label className="label-field">یادداشت</label>
          <textarea className="input-field min-h-[80px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">انصراف</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'در حال ذخیره...' : patient ? 'بروزرسانی' : 'ثبت بیمار'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
