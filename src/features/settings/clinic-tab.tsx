import { useState, useEffect } from 'react';
import { NumberInput } from '@/components/ui/number-input';
import { RotateCcw } from 'lucide-react';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { ClinicSettings } from '@/lib/types';

export function ClinicTab() {
  const [clinic, setClinic] = useState<ClinicSettings | null>(null);
  /** Kept apart from `clinic` so the field can be emptied while typing; empty saves as 0. */
  const [taxRate, setTaxRate] = useState<number | null>(null);

  useEffect(() => {
    const row = db.first('clinic_settings');
    setClinic(row);
    setTaxRate(row?.tax_rate ?? null);
  }, []);

  function saveClinic() {
    if (!clinic) return;
    db.update('clinic_settings', clinic.id, {
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone,
      email: clinic.email,
      tax_rate: taxRate ?? 0,
    });
    showToast('تنظیمات ذخیره شد');
  }

  function resetData() {
    if (!window.confirm('همه تغییرات حذف شده و داده‌های نمونه بازگردانده می‌شوند. ادامه می‌دهید؟')) return;
    db.resetStore();
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      {clinic && (
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-surface-700">اطلاعات کلینیک</h2>
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
              <NumberInput decimal value={taxRate} onChange={setTaxRate} placeholder="0" />
            </div>
          </div>
          <button onClick={saveClinic} className="btn-primary px-6 py-2.5">
            ذخیره تغییرات
          </button>
        </div>
      )}

      <div className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-surface-700">داده‌های نمونه</h2>
          <p className="text-xs text-surface-400 mt-1">اطلاعات در همین مرورگر ذخیره می‌شود. بازنشانی، همه تغییرات را حذف و داده‌های نمونه را بازمی‌گرداند.</p>
        </div>
        <button onClick={resetData} className="btn-danger shrink-0">
          <RotateCcw size={16} />
          بازنشانی داده‌ها
        </button>
      </div>
    </div>
  );
}
