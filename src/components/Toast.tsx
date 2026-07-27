import { CheckCircle2, Info, X } from 'lucide-react';
import { useEffect } from 'react';

export interface ToastMessage {
  id: number;
  message: string;
  tone?: 'success' | 'info';
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function Toast({ onDismiss, toast }: ToastProps) {
  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(onDismiss, 3_200);
    return () => window.clearTimeout(timer);
  }, [onDismiss, toast]);

  if (!toast) {
    return null;
  }

  const Icon = toast.tone === 'success' ? CheckCircle2 : Info;

  return (
    <div
      aria-atomic="true"
      className={`toast toast--${toast.tone ?? 'info'}`}
      role="status"
    >
      <Icon aria-hidden="true" size={18} strokeWidth={2} />
      <span>{toast.message}</span>
      <button aria-label="Dismiss notification" onClick={onDismiss} type="button">
        <X aria-hidden="true" size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
