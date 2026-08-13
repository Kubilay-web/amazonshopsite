"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Spinner } from "@/components/ui/spinner";
import { DeleteButton } from "@/components/admin/delete-button";
import { useToast } from "@/components/providers/toast-provider";
import { finalPrice, formatPrice, truncate } from "@/lib/utils";

export type ProductRow = {
  id: string;
  title: string;
  brand: string | null;
  images: string[];
  price: number;
  discountPercent: number;
  stock: number;
  sold: number;
  isActive: boolean;
  featured: boolean;
  categoryName: string;
};

type BulkAction =
  | "activate"
  | "deactivate"
  | "feature"
  | "unfeature"
  | "discount"
  | "stock"
  | "category"
  | "delete";

const SIMPLE_ACTIONS: { key: BulkAction; label: string; tone?: string }[] = [
  { key: "activate", label: "Yayına al" },
  { key: "deactivate", label: "Pasife al" },
  { key: "feature", label: "Öne çıkar" },
  { key: "unfeature", label: "Öne çıkarmayı kaldır" },
];

/** Seçim, toplu işlem ve satır aksiyonları içeren ürün tablosu. */
export function ProductTable({
  products,
  categories,
  lowStockThreshold,
}: {
  products: ProductRow[];
  categories: { id: string; name: string }[];
  lowStockThreshold: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [prompt, setPrompt] = useState<BulkAction | null>(null);
  const [discountValue, setDiscountValue] = useState(10);
  const [stockValue, setStockValue] = useState(0);
  const [categoryValue, setCategoryValue] = useState(categories[0]?.id ?? "");

  const allSelected = products.length > 0 && selected.length === products.length;

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAll() {
    setSelected(allSelected ? [] : products.map((p) => p.id));
  }

  async function run(action: BulkAction, extra: Record<string, unknown> = {}) {
    if (selected.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "İşlem başarısız");
      toast(`${data.count} ürün güncellendi`);
      setSelected([]);
      setPrompt(null);
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Toplu işlem çubuğu */}
      {selected.length > 0 && (
        <div className="animate-fade-in sticky top-0 z-20 space-y-2 rounded-lg border border-amz-orange bg-amber-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-medium text-zinc-800">
              {selected.length} ürün seçildi
            </span>
            {busy && <Spinner className="size-4" />}

            {SIMPLE_ACTIONS.map((action) => (
              <button
                key={action.key}
                type="button"
                disabled={busy}
                onClick={() => run(action.key)}
                className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs hover:bg-zinc-50"
              >
                {action.label}
              </button>
            ))}

            <button
              type="button"
              disabled={busy}
              onClick={() => setPrompt(prompt === "discount" ? null : "discount")}
              className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs hover:bg-zinc-50"
            >
              İndirim uygula
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setPrompt(prompt === "stock" ? null : "stock")}
              className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs hover:bg-zinc-50"
            >
              Stok ata
            </button>
            <button
              type="button"
              disabled={busy || categories.length === 0}
              onClick={() => setPrompt(prompt === "category" ? null : "category")}
              className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs hover:bg-zinc-50"
            >
              Kategori taşı
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setPrompt(prompt === "delete" ? null : "delete")}
              className="rounded-full border border-rose-300 bg-white px-3 py-1 text-xs text-rose-700 hover:bg-rose-50"
            >
              Sil
            </button>

            <button
              type="button"
              onClick={() => {
                setSelected([]);
                setPrompt(null);
              }}
              className="ml-auto inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900"
            >
              <X className="size-3.5" /> Seçimi temizle
            </button>
          </div>

          {prompt === "discount" && (
            <div className="flex flex-wrap items-center gap-2 border-t border-amber-200 pt-2">
              <label className="text-sm text-zinc-700">İndirim oranı (%)</label>
              <input
                type="number"
                min={0}
                max={95}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-24 rounded border border-zinc-300 px-2 py-1 text-sm"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => run("discount", { discountPercent: discountValue })}
                className="btn-amz"
              >
                Uygula
              </button>
            </div>
          )}

          {prompt === "stock" && (
            <div className="flex flex-wrap items-center gap-2 border-t border-amber-200 pt-2">
              <label className="text-sm text-zinc-700">Yeni stok değeri</label>
              <input
                type="number"
                min={0}
                value={stockValue}
                onChange={(e) => setStockValue(Number(e.target.value))}
                className="w-24 rounded border border-zinc-300 px-2 py-1 text-sm"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => run("stock", { stock: stockValue })}
                className="btn-amz"
              >
                Uygula
              </button>
            </div>
          )}

          {prompt === "category" && (
            <div className="flex flex-wrap items-center gap-2 border-t border-amber-200 pt-2">
              <label className="text-sm text-zinc-700">Hedef kategori</label>
              <select
                value={categoryValue}
                onChange={(e) => setCategoryValue(e.target.value)}
                className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy || !categoryValue}
                onClick={() => run("category", { categoryId: categoryValue })}
                className="btn-amz"
              >
                Taşı
              </button>
              <span className="text-xs text-zinc-500">Alt kategori bilgisi sıfırlanır.</span>
            </div>
          )}

          {prompt === "delete" && (
            <div className="flex flex-wrap items-center gap-2 border-t border-amber-200 pt-2">
              <span className="text-sm text-rose-700">
                {selected.length} ürün, yorumları ve favori kayıtlarıyla birlikte silinecek.
                Bu işlem geri alınamaz.
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => run("delete")}
                className="rounded-full bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
              >
                Evet, sil
              </button>
              <button
                type="button"
                onClick={() => setPrompt(null)}
                className="btn-amz-outline"
              >
                Vazgeç
              </button>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-225 text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Tümünü seç"
                  className="size-4 accent-amz-orange"
                />
              </th>
              <th className="px-3 py-2.5">Ürün</th>
              <th className="px-3 py-2.5">Kategori</th>
              <th className="px-3 py-2.5 text-right">Fiyat</th>
              <th className="px-3 py-2.5 text-right">Stok</th>
              <th className="px-3 py-2.5 text-right">Satış</th>
              <th className="px-3 py-2.5">Durum</th>
              <th className="px-3 py-2.5 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-zinc-500">
                  Ürün bulunamadı.
                </td>
              </tr>
            )}
            {products.map((product) => (
              <tr
                key={product.id}
                className={selected.includes(product.id) ? "bg-amber-50/60" : "hover:bg-zinc-50"}
              >
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.includes(product.id)}
                    onChange={() => toggle(product.id)}
                    aria-label={`${product.title} seç`}
                    className="size-4 accent-amz-orange"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="relative size-11 shrink-0 overflow-hidden rounded border border-zinc-200 bg-white">
                      <SafeImage
                        src={product.images[0]}
                        alt={product.title}
                        fill
                        sizes="44px"
                        className="object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900">{truncate(product.title, 50)}</p>
                      <p className="text-xs text-zinc-500">{product.brand ?? "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-zinc-600">{product.categoryName}</td>
                <td className="px-3 py-2.5 text-right">
                  <p className="font-semibold text-zinc-900">
                    {formatPrice(finalPrice(product.price, product.discountPercent))}
                  </p>
                  {product.discountPercent > 0 && (
                    <p className="text-xs text-zinc-400 line-through">
                      {formatPrice(product.price)}
                    </p>
                  )}
                </td>
                <td
                  className={`px-3 py-2.5 text-right font-medium ${
                    product.stock <= lowStockThreshold ? "text-rose-600" : "text-zinc-700"
                  }`}
                >
                  {product.stock}
                </td>
                <td className="px-3 py-2.5 text-right text-zinc-600">{product.sold}</td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        product.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      {product.isActive ? "Yayında" : "Pasif"}
                    </span>
                    {product.featured && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700">
                        Öne çıkan
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="inline-flex items-center gap-1 text-xs text-amz-link hover:text-amz-link-hover"
                    >
                      <Pencil className="size-3.5" /> Düzenle
                    </Link>
                    <DeleteButton endpoint={`/api/products/${product.id}`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
