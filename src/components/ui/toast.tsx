import React, { createContext, useContext, useState, useCallback } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

const iconMap: Record<ToastType, LucideIcon> = {
  success: CircleCheck,
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
};

let toastId = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const iconColorMap: Record<ToastType, string> = {
    success: 'text-ok',
    error: 'text-bad',
    warning: 'text-warn',
    info: 'text-info',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-20 right-4 md:top-28 md:right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const Icon = iconMap[toast.type];
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex w-[min(26rem,calc(100vw-2rem))] items-center gap-2.5 rounded-card border bg-popover px-3.5 py-3 text-popover-foreground shadow-float animate-slideUp"
            >
              <Icon className={`size-5 flex-shrink-0 ${iconColorMap[toast.type]}`} aria-hidden />
              <span className="text-sm font-semibold flex-1">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                aria-label="Tutup"
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
