/**
 * Toast notification system.
 * Supports undo-delete pattern (ADR-005): show a toast with an undo action,
 * delay the actual delete, cancel on undo.
 */

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';

interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
  duration: number;
}

type AddToastInput = Omit<ToastItem, 'id' | 'duration'> & { duration?: number };

interface ToastContextValue {
  addToast: (toast: AddToastInput) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
  removeToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: AddToastInput) => {
    const id = String(++toastId);
    setToasts((prev) => [...prev, { duration: 3000, ...toast, id }]);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, onDismiss]);

  const bgColor = toast.type === 'error' ? 'bg-red-800' : toast.type === 'success' ? 'bg-gray-800' : 'bg-gray-800';

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-lg ${bgColor} px-4 py-3 text-sm text-white shadow-lg animate-fade-in`}
    >
      <span>{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => {
            toast.action?.onClick();
            onDismiss();
          }}
          className="font-semibold text-brand-300 hover:text-brand-200 transition-colors"
        >
          {toast.action.label}
        </button>
      )}
      <button onClick={onDismiss} className="ml-1 text-sidebar-muted hover:text-white">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
