import { useState, useEffect } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { ClinicSettings } from '@/lib/types';

export function ClinicTab() {
  const [clinic, setClinic] = useState<ClinicSettings | null>(null);

  useEffect(() => {
    setClinic(db.first('clinic_settings'));
  }, []);

  function saveClinic() {
    if (!clinic) return;
    db.update('clinic_settings', clinic.id, {
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone,
      email: clinic.email,
      tax_rate: clinic.tax_rate,
    });
    showToast('تنظیمات ذخیره شد');
  }

  function resetData() {
    if (!window.confirm('همه تغییرات حذف شده و داده‌های نمونه بازگردانده می‌شوند. ادامه می‌دهید؟')) return;
    db.resetStore();
    window.location.reload();
  }

  return (
    <>
      {clinic && (
        <div className="card p-6 space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">نام کلینیک</label>
              <input className="input-field" value={clinic.name} onChange={(e) => setClinic({ ...clinic, name: e.target.value })} />
            </div>
            <div>
              <label className="label-field">تلفن</label>
              <input className="input-field" value={clinic.phone || ''} onChange={(e) => setClinic({ ...clinic, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label-field">آدرس</label>
            <input className="input-field" value={clinic.address || ''} onChange={(e) => setClinic({ ...clinic, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">ایمیل</label>
              <input className="input-field" value={clinic.email || ''} onChange={(e) => setClinic({ ...clinic, email: e.target.value })} />
            </div>
            <div>
              <label className="label-field">نرخ مالیات (٪)</label>
              <input type="number" className="input-field" value={clinic.tax_rate} onChange={(e) => setClinic({ ...clinic, tax_rate: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <button onClick={saveClinic} className="btn-primary">
            <Save size={18} />
            ذخیره تغییرات
          </button>
        </div>
      )}

      <div className="card p-6 max-w-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-surface-800">داده‌های نمونه</h3>
          <p className="text-sm text-surface-400 mt-1">اطلاعات در همین مرورگر ذخیره می‌شود. بازنشانی، همه تغییرات را حذف و داده‌های نمونه را بازمی‌گرداند.</p>
        </div>
        <button onClick={resetData} className="btn-danger shrink-0">
          <RotateCcw size={18} />
          بازنشانی داده‌ها
        </button>
      </div>
    </>
  );
}
