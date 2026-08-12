"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; message: string; kind: ToastKind };

type ToastContextValue = {
  toast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast, ToastProvider içinde kullanılmalı");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = "success") => {
      const id = ++counter.current;
      setToasts((prev) => [...prev, { id, message, kind }]);
      setTimeout(() => remove(id), 3500);
    },
    [remove],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-100 flex flex-col items-center gap-2 px-4 sm:bottom-auto sm:top-4 sm:items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "animate-fade-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg",
              t.kind === "success" && "border-emerald-200 bg-white text-emerald-900",
              t.kind === "error" && "border-rose-200 bg-white text-rose-900",
              t.kind === "info" && "border-zinc-200 bg-white text-zinc-900",
            )}
          >
            {t.kind === "success" && (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            )}
            {t.kind === "error" && <XCircle className="mt-0.5 size-5 shrink-0 text-rose-600" />}
            {t.kind === "info" && <Info className="mt-0.5 size-5 shrink-0 text-zinc-500" />}
            <p className="flex-1 text-sm leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => remove(t.id)}
              className="shrink-0 rounded p-0.5 text-zinc-400 hover:text-zinc-700"
              aria-label="Kapat"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
