import { Bell, Clock, Save, type LucideIcon } from 'lucide-react';
import { IconBox } from '@/components/ui/icon-box';
import type { Tone } from '@/components/ui/tones';
import { showToast } from '@/lib/toast';

// These switches are not stored yet; they show the reminders the clinic can send.
const options: { title: string; description: string; icon: LucideIcon; tone: Tone; enabled: boolean }[] = [
  { title: 'یادآوری نوبت', description: 'ارسال خودکار یادآوری نوبت به بیماران', icon: Bell, tone: 'primary', enabled: true },
  { title: 'پیام تبریک تولد', description: 'ارسال خودکار پیام تبریک تولد به بیماران', icon: Clock, tone: 'secondary', enabled: true },
  { title: 'نظرخواهی بعد از درمان', description: 'ارسال فرم نظرخواهی پس از تکمیل درمان', icon: Bell, tone: 'accent', enabled: false },
  { title: 'یادآوری چکاپ', description: 'ارسال یادآوری چکاپ دوره‌ای (هر ۶ ماه)', icon: Bell, tone: 'warning', enabled: true },
];

export function NotificationsTab() {
  return (
    <div className="card p-6 space-y-4 max-w-2xl">
      {options.map((option) => (
        <div key={option.title} className="flex items-center gap-3 p-4 bg-surface-50 rounded-xl">
          <IconBox icon={option.icon} tone={option.tone} size={18} />
          <div className="flex-1">
            <p className="font-medium text-surface-800 text-sm">{option.title}</p>
            <p className="text-xs text-surface-400 mt-0.5">{option.description}</p>
          </div>
          <input type="checkbox" defaultChecked={option.enabled} className="w-5 h-5 accent-primary-500" />
        </div>
      ))}
      <button onClick={() => showToast('تنظیمات اعلان‌ها ذخیره شد')} className="btn-primary">
        <Save size={18} />
        ذخیره تنظیمات
      </button>
    </div>
  );
}
