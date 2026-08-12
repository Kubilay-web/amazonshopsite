"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({ page, pages }: { page: number; pages: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  if (pages <= 1) return null;

  function go(target: number) {
    const next = new URLSearchParams(params.toString());
    if (target <= 1) next.delete("page");
    else next.set("page", String(target));
    router.push(`${pathname}?${next.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Geçerli sayfanın etrafında en fazla 5 numara göster
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  const numbers = [];
  for (let i = start; i <= end; i++) numbers.push(i);

  return (
    <nav className="flex items-center justify-center gap-1 py-6" aria-label="Sayfalama">
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className="btn-amz-outline px-3 disabled:opacity-40"
        aria-label="Önceki sayfa"
      >
        <ChevronLeft className="size-4" />
        <span className="hidden sm:inline">Önceki</span>
      </button>

      {numbers.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => go(n)}
          aria-current={n === page ? "page" : undefined}
          className={cn(
            "min-w-9 rounded-md border px-3 py-2 text-sm",
            n === page
              ? "border-amz-orange bg-amz-orange font-semibold text-zinc-900"
              : "border-amz-border bg-white text-zinc-700 hover:bg-amz-light",
          )}
        >
          {n}
        </button>
      ))}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= pages}
        className="btn-amz-outline px-3 disabled:opacity-40"
        aria-label="Sonraki sayfa"
      >
        <span className="hidden sm:inline">Sonraki</span>
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
