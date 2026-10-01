export type ToastType = 'success' | 'error' | 'info';

type ToastListener = (message: string, type: ToastType) => void;

// One listener: the <ToastContainer /> mounted in app.tsx.
let listener: ToastListener | null = null;

/** Shows a toast from anywhere in the app. */
export function showToast(message: string, type: ToastType = 'success') {
  listener?.(message, type);
}

/** Registers the component that renders toasts; returns a function that unregisters it. */
export function onToast(next: ToastListener): () => void {
  listener = next;
  return () => {
    if (listener === next) listener = null;
  };
}
