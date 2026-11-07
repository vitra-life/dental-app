import { useState } from 'react';
import { Building2, ChevronLeft, UserRound } from 'lucide-react';
import { useLogout, useSwitchWorkspace, type Me } from '@/data/session';
import { errorMessage } from '@/lib/api/errors';
import { AuthCard } from './auth-card';

/**
 * After login, for someone with several workspaces: first the clinic (when
 * there are several), then the position to work in.
 */
export function WorkspacePickerPage({ me }: { me: Me }) {
  const switchWorkspace = useSwitchWorkspace();
  const logout = useLogout();
  const [clinicId, setClinicId] = useState(me.clinics.length === 1 ? me.clinics[0].clinic_id : null);
  const clinic = me.clinics.find((c) => c.clinic_id === clinicId);

  const logoutButton = (
    <button onClick={() => logout.mutate()} className="btn-secondary w-full py-2.5 mt-2">خروج</button>
  );

  if (me.clinics.length === 0) {
    return (
      <AuthCard
        title="جایگاهی ندارید"
        subtitle="هنوز در هیچ کلینیکی جایگاه فعالی برای شما تعریف نشده است. با مدیر کلینیک تماس بگیرید."
      >
        {logoutButton}
      </AuthCard>
    );
  }

  if (!clinic) {
    return (
      <AuthCard title="انتخاب کلینیک" subtitle={`${me.user.full_name}، در کدام کلینیک کار می‌کنید؟`}>
        <div className="space-y-2">
          {me.clinics.map((c) => (
            <Choice
              key={c.clinic_id}
              icon={<Building2 size={18} className="text-primary-600 shrink-0" />}
              title={c.clinic_name}
              subtitle={c.workspaces.map((w) => w.label).join('، ')}
              onClick={() => setClinicId(c.clinic_id)}
            />
          ))}
          {logoutButton}
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="انتخاب جایگاه" subtitle={`در ${clinic.clinic_name} با کدام جایگاه کار می‌کنید؟`}>
      <div className="space-y-2">
        {clinic.workspaces.map((w) => (
          <Choice
            key={w.id}
            icon={<UserRound size={18} className="text-primary-600 shrink-0" />}
            title={w.label}
            disabled={switchWorkspace.isPending}
            onClick={() => switchWorkspace.mutate(w.id)}
          />
        ))}
        {switchWorkspace.error && <p role="alert" className="text-sm text-error-600">{errorMessage(switchWorkspace.error)}</p>}
        {me.clinics.length > 1 && (
          <button onClick={() => setClinicId(null)} className="btn-ghost w-full text-sm">
            کلینیک دیگر
          </button>
        )}
        {logoutButton}
      </div>
    </AuthCard>
  );
}

interface ChoiceProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  disabled?: boolean;
  onClick: () => void;
}

function Choice({ icon, title, subtitle, disabled, onClick }: ChoiceProps) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl border border-surface-200 hover:border-primary-300 hover:bg-primary-50 text-right transition-colors"
    >
      {icon}
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-surface-800 truncate">{title}</span>
        {subtitle && <span className="block text-xs text-surface-500 truncate">{subtitle}</span>}
      </span>
      <ChevronLeft size={16} className="text-surface-400 shrink-0" />
    </button>
  );
}
