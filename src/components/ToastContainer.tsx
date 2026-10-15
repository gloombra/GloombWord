import { AlertCircle, Info, CheckCircle } from 'lucide-react';
import type { Toast } from '@/hooks/useToasts';

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

const TOAST_STYLES = {
  error: 'bg-red-950/95 border-red-700 text-red-100',
  info: 'bg-zinc-900/95 border-zinc-600 text-zinc-100',
  success: 'bg-green-950/95 border-green-700 text-green-100',
};

const TOAST_ICONS = {
  error: <AlertCircle size={18} className="text-red-400 shrink-0" />,
  info: <Info size={18} className="text-zinc-400 shrink-0" />,
  success: <CheckCircle size={18} className="text-green-400 shrink-0" />,
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => onDismiss(toast.id)}
          className={`
            toast-in pointer-events-auto cursor-pointer
            flex items-center gap-2.5 px-4 py-2.5
            rounded-lg border backdrop-blur-sm
            shadow-lg text-sm font-medium
            max-w-sm text-center
            ${TOAST_STYLES[toast.type]}
          `}
        >
          {TOAST_ICONS[toast.type]}
          {toast.message}
        </div>
      ))}
    </div>
  );
}
