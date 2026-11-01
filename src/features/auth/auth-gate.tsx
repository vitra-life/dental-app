import { Skeleton } from '@/components/ui/skeleton';
import { LoadError } from '@/components/ui/load-error';
import { useMe, useSession } from '@/data/session';
import { ChangePasswordPage } from './change-password-page';
import { ClinicPickerPage } from './clinic-picker-page';
import { LoginPage } from './login-page';

/**
 * Shows the app only to a signed-in user with a permanent password and an
 * active clinic; otherwise the screen that gets them there.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const signedIn = useSession();
  const me = useMe();

  if (!signedIn) return <LoginPage />;
  if (me.isPending) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
        <Skeleton className="h-40 w-full max-w-sm" />
      </div>
    );
  }
  if (me.error || !me.data) return <LoadError error={me.error} onRetry={() => me.refetch()} />;
  if (me.data.user.must_change_password) return <ChangePasswordPage />;
  if (!me.data.active_clinic_id) return <ClinicPickerPage me={me.data} />;
  return <>{children}</>;
}
