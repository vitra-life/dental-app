import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';

export function LabForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);

  function save() {
    if (!form.name) { showToast('نام لابراتوار الزامی است', 'error'); return; }
    setSaving(true);
    db.insert('labs', {
      name: form.name,
      contact_person: form.contact_person || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
    });
    showToast('لابراتوار ثبت شد');
    onSaved();
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
