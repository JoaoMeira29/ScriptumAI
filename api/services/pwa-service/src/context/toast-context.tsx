"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ToastKind = "success" | "error" | "info";

type ToastItem = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastContextValue = {
  showToast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);

    setToasts((current) => [...current, { id, kind, message }]);

    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  }, [dismissToast]);

  const value = useMemo(
    () => ({ showToast }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
        {toasts.map((toast) => {
          const style =
            toast.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : toast.kind === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-cyan-200 bg-cyan-50 text-cyan-800";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-lg border px-3 py-2 text-sm shadow-md backdrop-blur ${style}`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start justify-between gap-3">
                <p>{toast.message}</p>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="shrink-0 text-xs font-medium opacity-80 hover:opacity-100"
                  aria-label="Dismiss notification"
                >
                  Close
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return context;
}