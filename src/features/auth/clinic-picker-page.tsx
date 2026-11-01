import { Building2 } from 'lucide-react';
import { useLogout, useSwitchClinic, type Me } from '@/data/session';
import { errorMessage } from '@/lib/api/errors';
import { AuthCard } from './auth-card';

/** For members of several clinics, after login: which clinic to work in. */
export function ClinicPickerPage({ me }: { me: Me }) {
  const switchClinic = useSwitchClinic();
  const logout = useLogout();

  if (me.clinics.length === 0) {
    return (
      <AuthCard title="کلینیکی ندارید" subtitle="حساب شما عضو هیچ کلینیک فعالی نیست. با مدیر کلینیک تماس بگیرید.">
        <button onClick={() => logout.mutate()} className="btn-secondary w-full py-2.5">خروج</button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="انتخاب کلینیک" subtitle={`${me.user.full_name}، در کدام کلینیک کار می‌کنید؟`}>
      <div className="space-y-2">
        {me.clinics.map((clinic) => (
          <button
            key={clinic.clinic_id}
            disabled={switchClinic.isPending}
            onClick={() => switchClinic.mutate(clinic.clinic_id)}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-surface-200 hover:border-primary-300 hover:bg-primary-50 text-right transition-colors"
          >
            <Building2 size={18} className="text-primary-600 shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-surface-800 truncate">{clinic.clinic_name}</span>
              <span className="block text-xs text-surface-500 truncate">{clinic.roles.map((r) => r.name).join('، ') || 'بدون نقش'}</span>
            </span>
          </button>
        ))}
        {switchClinic.error && <p role="alert" className="text-sm text-error-600">{errorMessage(switchClinic.error)}</p>}
        <button onClick={() => logout.mutate()} className="btn-secondary w-full py-2.5 mt-2">خروج</button>
      </div>
    </AuthCard>
  );
}
