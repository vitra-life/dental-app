import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { Service } from '@/lib/types';

const categories = [
  { value: 'general', label: 'عمومی' },
  { value: 'endodontics', label: 'اندودنتیکس' },
  { value: 'surgery', label: 'جراحی' },
  { value: 'prosthodontics', label: 'پروتز' },
  { value: 'cosmetic', label: 'زیبایی' },
  { value: 'orthodontics', label: 'ارتودنسی' },
];

export function ServicesTab() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    setServices(db.orderBy(db.list('services'), 'name'));
  }, []);

  /** Edits a row locally; nothing is stored until its save button is pressed. */
  function edit(id: string, patch: Partial<Service>) {
    setServices(services.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function addService() {
    const created = db.insert('services', { name: 'خدمت جدید', category: 'general', default_price: 0, duration_minutes: 30 });
    setServices([...services, created]);
    showToast('خدمت جدید اضافه شد');
  }

  function saveService(s: Service) {
    db.update('services', s.id, {
      name: s.name,
      category: s.category,
      default_price: s.default_price,
      duration_minutes: s.duration_minutes,
      active: s.active,
    });
    showToast('بروزرسانی شد');
  }

  function deleteService(id: string) {
    db.remove('services', id);
    setServices(services.filter((s) => s.id !== id));
    showToast('حذف شد');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-500">{formatNumber(services.length)} خدمت</p>
        <button onClick={addService} className="btn-primary"><Plus size={18} />افزودن خدمت</button>
      </div>
      <div className="space-y-3">
        {services.map((s) => (
          <div key={s.id} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                <input className="input-field" value={s.name} onChange={(e) => edit(s.id, { name: e.target.value })} placeholder="نام خدمت" />
                <select className="input-field" value={s.category} onChange={(e) => edit(s.id, { category: e.target.value })}>
                  {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <input type="number" className="input-field" value={s.default_price} onChange={(e) => edit(s.id, { default_price: parseFloat(e.target.value) || 0 })} placeholder="قیمت" />
                <div className="flex items-center gap-2">
                  <input type="number" className="input-field w-20" value={s.duration_minutes} onChange={(e) => edit(s.id, { duration_minutes: parseInt(e.target.value) || 30 })} placeholder="دقیقه" />
                  <button onClick={() => saveService(s)} className="btn-secondary text-xs">ذخیره</button>
                  <button onClick={() => deleteService(s.id)} className="p-2 rounded-lg hover:bg-error-50"><Trash2 size={16} className="text-error-400" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
