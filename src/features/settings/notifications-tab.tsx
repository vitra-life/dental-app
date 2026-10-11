import { useState } from 'react';
import { showToast } from '@/lib/toast';

// These switches are not stored yet; they show the reminders the clinic can send.
const options = [
  { key: 'reminder', title: 'یادآوری نوبت', description: 'ارسال خودکار یادآوری نوبت به بیماران', enabled: true },
  { key: 'birthday', title: 'پیام تبریک تولد', description: 'ارسال خودکار پیام تبریک تولد به بیماران', enabled: true },
  { key: 'survey', title: 'نظرخواهی بعد از درمان', description: 'ارسال فرم نظرخواهی پس از تکمیل درمان', enabled: false },
  { key: 'checkup', title: 'یادآوری چکاپ', description: 'ارسال یادآوری چکاپ دوره‌ای (هر ۶ ماه)', enabled: true },
];

export function NotificationsTab() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(options.map((o) => [o.key, o.enabled])));

  return (
    <div className="card p-6">
      <h2 className="text-sm font-semibold text-surface-700 mb-5">تنظیمات اعلان</h2>
      <div className="space-y-4">
        {options.map((option) => {
          const on = enabled[option.key];
          return (
            <div key={option.key} className="flex items-center justify-between gap-3 p-4 bg-surface-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-surface-700">{option.title}</p>
                <p className="text-xs text-surface-400 mt-0.5">{option.description}</p>
              </div>
              <button
                role="switch"
                aria-checked={on}
                aria-label={option.title}
                onClick={() => setEnabled({ ...enabled, [option.key]: !on })}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${on ? 'bg-primary-600' : 'bg-surface-300'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${on ? 'right-1' : 'right-6'}`} />
              </button>
            </div>
          );
        })}
      </div>
      <button onClick={() => showToast('تنظیمات اعلان‌ها ذخیره شد')} className="btn-primary mt-5 px-6 py-2.5">ذخیره تنظیمات</button>
    </div>
  );
}
