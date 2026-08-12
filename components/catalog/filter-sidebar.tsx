"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Rating } from "@/components/ui/rating";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  slug: string;
  subCategories: { id: string; name: string; slug: string }[];
};

export function FilterSidebar({
  categories,
  brands,
  activeCategorySlug,
}: {
  categories: Category[];
  brands: string[];
  activeCategorySlug?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const current = new URLSearchParams(params.toString());
  const activeCategory =
    categories.find((c) => c.slug === (activeCategorySlug ?? current.get("category"))) ?? null;

  function apply(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
    setOpen(false);
  }

  function clearAll() {
    const next = new URLSearchParams();
    const q = params.get("q");
    if (q) next.set("q", q);
    router.push(`${pathname}?${next.toString()}`);
    setOpen(false);
  }

  const activeCount = ["category", "subCategory", "brand", "minPrice", "maxPrice", "rating"].filter(
    (k) => params.get(k),
  ).length;

  const content = (
    <div className="space-y-5 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-zinc-900">Filtreler</h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-amz-link hover:text-amz-link-hover"
          >
            Temizle ({activeCount})
          </button>
        )}
      </div>

      {!activeCategorySlug && (
        <div>
          <h3 className="mb-1.5 font-bold text-zinc-900">Kategori</h3>
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => apply({ category: null, subCategory: null })}
                className={cn(
                  "text-left hover:text-amz-link-hover",
                  !params.get("category") ? "font-semibold text-amz-link" : "text-zinc-700",
                )}
              >
                Tüm kategoriler
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => apply({ category: c.slug, subCategory: null })}
                  className={cn(
                    "text-left hover:text-amz-link-hover",
                    params.get("category") === c.slug
                      ? "font-semibold text-amz-link"
                      : "text-zinc-700",
                  )}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeCategory && activeCategory.subCategories.length > 0 && (
        <div>
          <h3 className="mb-1.5 font-bold text-zinc-900">Alt kategori</h3>
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => apply({ subCategory: null })}
                className={cn(
                  "text-left hover:text-amz-link-hover",
                  !params.get("subCategory") ? "font-semibold text-amz-link" : "text-zinc-700",
                )}
              >
                Tümü
              </button>
            </li>
            {activeCategory.subCategories.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => apply({ subCategory: s.slug })}
                  className={cn(
                    "text-left hover:text-amz-link-hover",
                    params.get("subCategory") === s.slug
                      ? "font-semibold text-amz-link"
                      : "text-zinc-700",
                  )}
                >
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="mb-1.5 font-bold text-zinc-900">Müşteri puanı</h3>
        <ul className="space-y-1.5">
          {[4, 3, 2, 1].map((r) => (
            <li key={r}>
              <button
                type="button"
                onClick={() => apply({ rating: params.get("rating") === String(r) ? null : String(r) })}
                className={cn(
                  "flex items-center gap-1.5",
                  params.get("rating") === String(r) && "font-semibold",
                )}
              >
                <Rating value={r} showCount={false} />
                <span className="text-zinc-700">ve üzeri</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-1.5 font-bold text-zinc-900">Fiyat aralığı</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            apply({
              minPrice: String(form.get("minPrice") ?? ""),
              maxPrice: String(form.get("maxPrice") ?? ""),
            });
          }}
          className="flex items-center gap-2"
        >
          <input
            name="minPrice"
            type="number"
            min={0}
            placeholder="En az"
            defaultValue={params.get("minPrice") ?? ""}
            className="input-amz w-full"
          />
          <span className="text-zinc-400">–</span>
          <input
            name="maxPrice"
            type="number"
            min={0}
            placeholder="En çok"
            defaultValue={params.get("maxPrice") ?? ""}
            className="input-amz w-full"
          />
          <button type="submit" className="btn-amz-outline shrink-0 px-3">
            Uygula
          </button>
        </form>
      </div>

      {brands.length > 0 && (
        <div>
          <h3 className="mb-1.5 font-bold text-zinc-900">Marka</h3>
          <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {brands.map((brand) => (
              <li key={brand}>
                <label className="flex cursor-pointer items-center gap-2 text-zinc-700">
                  <input
                    type="checkbox"
                    checked={params.get("brand") === brand}
                    onChange={(e) => apply({ brand: e.target.checked ? brand : null })}
                    className="size-4 accent-amz-orange"
                  />
                  {brand}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label className="flex cursor-pointer items-center gap-2 font-medium text-zinc-800">
          <input
            type="checkbox"
            checked={params.get("discounted") === "true"}
            onChange={(e) => apply({ discounted: e.target.checked ? "true" : null })}
            className="size-4 accent-amz-orange"
          />
          Sadece indirimliler
        </label>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobil: filtre aç butonu */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-amz-outline w-full lg:hidden"
      >
        <SlidersHorizontal className="size-4" />
        Filtrele{activeCount > 0 ? ` (${activeCount})` : ""}
      </button>

      {/* Masaüstü sabit panel */}
      <aside className="hidden w-56 shrink-0 lg:block xl:w-64">
        <div className="sticky top-32 rounded-lg bg-white p-4">{content}</div>
      </aside>

      {/* Mobil çekmece */}
      {open && (
        <div className="fixed inset-0 z-90 flex lg:hidden">
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="animate-fade-in relative ml-auto h-full w-[85%] max-w-xs overflow-y-auto bg-white p-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded p-1 text-zinc-500 hover:bg-amz-light"
              aria-label="Kapat"
            >
              <X className="size-5" />
            </button>
            <div className="mt-6">{content}</div>
          </div>
        </div>
      )}
    </>
  );
}
