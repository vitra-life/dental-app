import { CloudOff } from 'lucide-react';
import { errorMessage } from '@/lib/api/errors';
import { EmptyState } from './empty-state';

/** Shown in place of a screen whose data could not be loaded from the server. */
export function LoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <EmptyState
      icon={CloudOff}
      title="اطلاعات بارگذاری نشد"
      description={errorMessage(error)}
      action={<button onClick={onRetry} className="btn-secondary">تلاش دوباره</button>}
    />
  );
}
