"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "newest", label: "En yeniler" },
  { value: "popular", label: "Çok satanlar" },
  { value: "price-asc", label: "Fiyat: düşükten yükseğe" },
  { value: "price-desc", label: "Fiyat: yüksekten düşüğe" },
  { value: "rating", label: "Müşteri puanı" },
  { value: "discount", label: "En yüksek indirim" },
];

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-700">
      <span className="hidden sm:inline">Sırala:</span>
      <select
        value={params.get("sort") ?? "newest"}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("sort", e.target.value);
          next.delete("page");
          router.push(`${pathname}?${next.toString()}`);
        }}
        className="rounded border border-amz-border bg-amz-light px-2 py-1.5 text-sm outline-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
