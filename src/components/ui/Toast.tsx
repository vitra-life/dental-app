import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

let toastFn: ((message: string, type?: ToastType) => void) | null = null;

export function showToast(message: string, type: ToastType = 'success') {
  toastFn?.(message, type);
}

export function ToastContainer() {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', visible: false });

  useEffect(() => {
    toastFn = (message: string, type: ToastType = 'success') => {
      setToast({ message, type, visible: true });
    };
    return () => { toastFn = null; };
  }, []);

  useEffect(() => {
    if (!toast.visible) return;
    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.visible]);

  if (!toast.visible) return null;

  const config = {
    success: { icon: CheckCircle, bg: 'bg-accent-50', border: 'border-accent-200', text: 'text-accent-700', iconColor: 'text-accent-500' },
    error: { icon: AlertCircle, bg: 'bg-error-50', border: 'border-error-200', text: 'text-error-700', iconColor: 'text-error-500' },
    info: { icon: Info, bg: 'bg-secondary-50', border: 'border-secondary-200', text: 'text-secondary-700', iconColor: 'text-secondary-500' },
  };
  const c = config[toast.type];
  const Icon = c.icon;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border ${c.bg} ${c.border} shadow-elevated`}>
        <Icon size={20} className={c.iconColor} />
        <span className={`text-sm font-medium ${c.text}`}>{toast.message}</span>
        <button
          onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
          className="p-1 rounded-lg hover:bg-white/50"
        >
          <X size={16} className={c.text} />
        </button>
      </div>
    </div>
  );
}
