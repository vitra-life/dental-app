import { Copy, KeyRound } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { showToast } from '@/lib/toast';

interface TemporaryPasswordModalProps {
  name: string;
  mobile: string;
  /** Shown only here: the API never returns it again. */
  password: string | null;
  onClose: () => void;
}

/** Shows a new account's (or a reset) temporary password once, to pass on to the person. */
export function TemporaryPasswordModal({ name, mobile, password, onClose }: TemporaryPasswordModalProps) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(password ?? '');
      showToast('کپی شد');
    } catch {
      showToast('کپی نشد؛ رمز را دستی یادداشت کنید', 'error');
    }
  }

  return (
    <Modal open={password !== null} onClose={onClose} title="رمز عبور موقت" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-surface-600">
          این رمز را به <span className="font-semibold text-surface-800">{name}</span> بدهید. با موبایل{' '}
          <span dir="ltr">{mobile}</span> وارد می‌شود و در اولین ورود باید رمز را تغییر دهد.
        </p>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-50 border border-surface-200">
          <KeyRound size={18} className="text-primary-600 shrink-0" />
          <code dir="ltr" className="flex-1 text-base font-mono tracking-wider text-surface-800 select-all">
            {password}
          </code>
          <button type="button" onClick={copy} title="کپی" className="p-2 rounded-lg text-surface-500 hover:bg-surface-100">
            <Copy size={16} />
          </button>
        </div>
        <p className="text-xs text-warning-600">این رمز دیگر نمایش داده نمی‌شود.</p>
        <button type="button" onClick={onClose} className="btn-primary w-full">
          متوجه شدم
        </button>
      </div>
    </Modal>
  );
}
