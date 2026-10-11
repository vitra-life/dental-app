import { useState } from 'react';
import { persianDays } from '@/lib/date';
import { DEFAULT_WORKING_HOURS, WEEKDAY_KEYS } from '@/lib/schedule';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { WorkingHours } from '@/lib/types';

/** What a closed day opens with when it is switched back on. */
const DEFAULT_DAY = { start: '09:00', end: '18:00' };

/** Opening hours per weekday. They decide which appointment slots each day offers. */
export function HoursTab() {
  const [clinicId] = useState(() => db.first('clinic_settings')?.id ?? null);
  const [hours, setHours] = useState<WorkingHours>(() => ({ ...DEFAULT_WORKING_HOURS, ...db.first('clinic_settings')?.working_hours }));

  const setDay = (key: string, day: WorkingHours[string]) => setHours({ ...hours, [key]: day });

  function save() {
    if (!clinicId) return;
    const invalid = WEEKDAY_KEYS.some((key) => {
      const day = hours[key];
      return day && day.start >= day.end;
    });
    if (invalid) { showToast('ساعت پایان باید بعد از ساعت شروع باشد', 'error'); return; }
    db.update('clinic_settings', clinicId, { working_hours: hours });
    showToast('ساعات کاری ذخیره شد');
  }

  return (
    <div className="card p-6">
      <h2 className="text-sm font-semibold text-surface-700 mb-1">ساعات کاری هفتگی</h2>
      <p className="text-xs text-surface-400 mb-4">نوبت‌های قابل رزرو هر روز بر اساس این ساعات ساخته می‌شوند.</p>
      <div className="space-y-3">
        {WEEKDAY_KEYS.map((key, i) => {
          const day = hours[key];
          return (
            <div key={key} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <label className="flex items-center gap-2 w-full sm:w-28 shrink-0 cursor-pointer">
                <input type="checkbox" checked={!!day} onChange={(e) => setDay(key, e.target.checked ? DEFAULT_DAY : null)} className="w-4 h-4 accent-primary-600" />
                <span className="text-sm text-surface-700 font-medium">{persianDays[i]}</span>
              </label>
              <input
                type="time"
                step={1800}
                aria-label={`شروع ${persianDays[i]}`}
                value={day?.start ?? DEFAULT_DAY.start}
                disabled={!day}
                onChange={(e) => day && setDay(key, { ...day, start: e.target.value })}
                className="input-field w-28 rounded-lg px-2 py-1.5 text-center disabled:opacity-40"
              />
              <span className="text-surface-400 text-sm">تا</span>
              <input
                type="time"
                step={1800}
                aria-label={`پایان ${persianDays[i]}`}
                value={day?.end ?? DEFAULT_DAY.end}
                disabled={!day}
                onChange={(e) => day && setDay(key, { ...day, end: e.target.value })}
                className="input-field w-28 rounded-lg px-2 py-1.5 text-center disabled:opacity-40"
              />
              {!day && <span className="text-xs text-surface-400 hidden sm:inline">تعطیل</span>}
            </div>
          );
        })}
      </div>
      <button onClick={save} className="btn-primary mt-5 px-6 py-2.5">ذخیره ساعات کاری</button>
    </div>
  );
}
