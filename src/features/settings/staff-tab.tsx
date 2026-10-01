import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { Staff } from '@/lib/types';

const roles: { value: Staff['role']; label: string }[] = [
  { value: 'dentist', label: 'دندانپزشک' },
  { value: 'receptionist', label: 'منشی' },
  { value: 'accountant', label: 'حسابدار' },
  { value: 'manager', label: 'مدیر' },
];

export function StaffTab() {
  const [staff, setStaff] = useState<Staff[]>([]);

  useEffect(() => {
    setStaff(db.orderBy(db.list('staff'), 'full_name'));
  }, []);

  /** Edits a row locally; nothing is stored until its save button is pressed. */
  function edit(id: string, patch: Partial<Staff>) {
    setStaff(staff.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function addStaff() {
    const created = db.insert('staff', { full_name: 'نام جدید', role: 'dentist', color: '#3b82f6' });
    setStaff([...staff, created]);
    showToast('عضو جدید اضافه شد');
  }

  function saveStaff(s: Staff) {
    db.update('staff', s.id, { full_name: s.full_name, role: s.role, phone: s.phone, color: s.color, active: s.active });
    showToast('بروزرسانی شد');
  }

  function deleteStaff(id: string) {
    db.remove('staff', id);
    setStaff(staff.filter((s) => s.id !== id));
    showToast('حذف شد');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-500">{formatNumber(staff.length)} عضو</p>
        <button onClick={addStaff} className="btn-primary"><Plus size={18} />افزودن عضو</button>
      </div>
      <div className="space-y-3">
        {staff.map((s) => (
          <div key={s.id} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: s.color }}>
                {s.full_name.charAt(0)}
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                <input className="input-field" value={s.full_name} onChange={(e) => edit(s.id, { full_name: e.target.value })} placeholder="نام" />
                <select className="input-field" value={s.role} onChange={(e) => edit(s.id, { role: e.target.value as Staff['role'] })}>
                  {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                </select>
                <input className="input-field" value={s.phone || ''} onChange={(e) => edit(s.id, { phone: e.target.value })} placeholder="تلفن" />
                <div className="flex items-center gap-2">
                  <input type="color" className="w-10 h-10 rounded-lg border border-surface-200" value={s.color} onChange={(e) => edit(s.id, { color: e.target.value })} />
                  <button onClick={() => saveStaff(s)} className="btn-secondary text-xs">ذخیره</button>
                  <button onClick={() => deleteStaff(s.id)} className="p-2 rounded-lg hover:bg-error-50"><Trash2 size={16} className="text-error-400" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
