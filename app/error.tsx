"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <AlertTriangle className="size-16 text-amber-400" strokeWidth={1.5} />
      <h1 className="text-2xl font-bold text-zinc-900">Bir şeyler ters gitti</h1>
      <p className="max-w-md text-sm text-zinc-600">
        {error.message || "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin."}
      </p>
      <button type="button" onClick={reset} className="btn-amz">
        Tekrar dene
      </button>
    </div>
  );
}
