"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Minus, Plus, RotateCcw, Save } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";
import { finalPrice, formatPrice, truncate } from "@/lib/utils";

export type InventoryRow = {
  id: string;
  title: string;
  sku: string | null;
  brand: string | null;
  images: string[];
  price: number;
  discountPercent: number;
  stock: number;
  sold: number;
  isActive: boolean;
  categoryName: string;
};

type Draft = { stock: number; price: number; discountPercent: number };

/**
 * Stok ve fiyatların tablo üzerinden toplu düzenlenmesi.
 * Değişiklikler yerelde biriktirilir, "Kaydet" ile tek istekte gönderilir.
 */
export function InventoryTable({
  products,
  lowStockThreshold,
}: {
  products: InventoryRow[];
  lowStockThreshold: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState(false);

  const original = useMemo(
    () =>
      Object.fromEntries(
        products.map((p) => [
          p.id,
          { stock: p.stock, price: p.price, discountPercent: p.discountPercent },
        ]),
      ) as Record<string, Draft>,
    [products],
  );

  function draftFor(id: string): Draft {
    return drafts[id] ?? original[id];
  }

  function isDirty(id: string) {
    const draft = drafts[id];
    if (!draft) return false;
    const base = original[id];
    return (
      draft.stock !== base.stock ||
      draft.price !== base.price ||
      draft.discountPercent !== base.discountPercent
    );
  }

  function update(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...draftFor(id), ...patch } }));
  }

  const dirtyIds = products.map((p) => p.id).filter(isDirty);

  async function save() {
    if (dirtyIds.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: dirtyIds.map((id) => ({ id, ...draftFor(id) })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Kaydedilemedi");
      toast(`${data.count} ürün güncellendi`);
      setDrafts({});
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Kaydetme çubuğu */}
      <div
        className={`sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 transition ${
          dirtyIds.length > 0
            ? "border-amz-orange bg-amber-50"
            : "border-zinc-200 bg-white"
        }`}
      >
        <p className="text-sm text-zinc-700">
          {dirtyIds.length > 0
            ? `${dirtyIds.length} üründe kaydedilmemiş değişiklik var`
            : "Stok, fiyat ve indirimi tablodan doğrudan düzenleyebilirsiniz."}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDrafts({})}
            disabled={dirtyIds.length === 0 || saving}
            className="btn-amz-outline"
          >
            <RotateCcw className="size-4" /> Geri al
          </button>
          <button
            type="button"
            onClick={save}
            disabled={dirtyIds.length === 0 || saving}
            className="btn-amz"
          >
            {saving ? <Spinner /> : <Save className="size-4" />} Kaydet
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-225 text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-3 py-2.5">Ürün</th>
              <th className="px-3 py-2.5">Kategori</th>
              <th className="px-3 py-2.5 text-center">Stok</th>
              <th className="px-3 py-2.5 text-right">Fiyat (€)</th>
              <th className="px-3 py-2.5 text-right">İndirim %</th>
              <th className="px-3 py-2.5 text-right">Net fiyat</th>
              <th className="px-3 py-2.5 text-right">Satış</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-zinc-500">
                  Ürün bulunamadı.
                </td>
              </tr>
            )}
            {products.map((product) => {
              const draft = draftFor(product.id);
              const dirty = isDirty(product.id);
              return (
                <tr
                  key={product.id}
                  className={dirty ? "bg-amber-50/60" : "hover:bg-zinc-50"}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded border border-zinc-200 bg-white">
                        <SafeImage
                          src={product.images[0]}
                          alt={product.title}
                          fill
                          sizes="40px"
                          className="object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="block font-medium text-zinc-900 hover:text-amz-link"
                        >
                          {truncate(product.title, 44)}
                        </Link>
                        <p className="text-xs text-zinc-500">
                          {product.sku || product.brand || "—"}
                          {!product.isActive && (
                            <span className="ml-2 rounded bg-zinc-200 px-1.5 text-[10px] text-zinc-600">
                              Pasif
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-zinc-600">{product.categoryName}</td>

                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          update(product.id, { stock: Math.max(0, draft.stock - 1) })
                        }
                        className="rounded border border-zinc-300 p-1 hover:bg-zinc-100"
                        aria-label="Stok azalt"
                      >
                        <Minus className="size-3" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={draft.stock}
                        onChange={(e) =>
                          update(product.id, { stock: Math.max(0, Number(e.target.value)) })
                        }
                        className={`w-16 rounded border px-1.5 py-1 text-center text-sm ${
                          draft.stock <= 0
                            ? "border-rose-300 bg-rose-50 text-rose-700"
                            : draft.stock <= lowStockThreshold
                              ? "border-amber-300 bg-amber-50 text-amber-800"
                              : "border-zinc-300"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => update(product.id, { stock: draft.stock + 1 })}
                        className="rounded border border-zinc-300 p-1 hover:bg-zinc-100"
                        aria-label="Stok artır"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                  </td>

                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={draft.price}
                      onChange={(e) =>
                        update(product.id, { price: Number(e.target.value) })
                      }
                      className="w-24 rounded border border-zinc-300 px-1.5 py-1 text-right text-sm"
                    />
                  </td>

                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      min={0}
                      max={95}
                      value={draft.discountPercent}
                      onChange={(e) =>
                        update(product.id, {
                          discountPercent: Math.min(95, Math.max(0, Number(e.target.value))),
                        })
                      }
                      className="w-18 rounded border border-zinc-300 px-1.5 py-1 text-right text-sm"
                    />
                  </td>

                  <td className="px-3 py-2 text-right font-semibold text-zinc-900">
                    {formatPrice(finalPrice(draft.price, draft.discountPercent))}
                  </td>
                  <td className="px-3 py-2 text-right text-zinc-600">{product.sold}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
