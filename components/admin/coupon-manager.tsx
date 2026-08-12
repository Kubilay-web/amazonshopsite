"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { DeleteButton } from "@/components/admin/delete-button";
import { useToast } from "@/components/providers/toast-provider";
import { formatDate, formatPrice } from "@/lib/utils";

export type Coupon = {
  id: string;
  code: string;
  discountPercent: number;
  minAmount: number;
  maxUses: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  active: boolean;
};

function toDateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

const EMPTY = {
  code: "",
  discountPercent: 10,
  minAmount: 0,
  maxUses: 0,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  active: true,
};

export function CouponManager({ coupons, now }: { coupons: Coupon[]; now: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const [modal, setModal] = useState<(typeof EMPTY & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!modal) return;
    setSaving(true);
    try {
      const res = await fetch(modal.id ? `/api/coupons/${modal.id}` : "/api/coupons", {
        method: modal.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modal),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Kaydedilemedi");
      toast(modal.id ? "Kupon güncellendi" : "Kupon oluşturuldu");
      setModal(null);
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => setModal({ ...EMPTY })} className="btn-amz">
        <Plus className="size-4" /> Yeni kupon
      </button>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-200 text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-3 py-2.5">Kod</th>
              <th className="px-3 py-2.5 text-right">İndirim</th>
              <th className="px-3 py-2.5 text-right">Min. tutar</th>
              <th className="px-3 py-2.5 text-center">Kullanım</th>
              <th className="px-3 py-2.5">Geçerlilik</th>
              <th className="px-3 py-2.5">Durum</th>
              <th className="px-3 py-2.5 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {coupons.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-zinc-500">
                  Henüz kupon yok.
                </td>
              </tr>
            )}
            {coupons.map((coupon) => {
              const expired = new Date(coupon.endDate).getTime() < now;
              return (
                <tr key={coupon.id} className="hover:bg-zinc-50">
                  <td className="px-3 py-2.5 font-mono font-bold text-zinc-900">
                    {coupon.code}
                  </td>
                  <td className="px-3 py-2.5 text-right">%{coupon.discountPercent}</td>
                  <td className="px-3 py-2.5 text-right text-zinc-600">
                    {coupon.minAmount > 0 ? formatPrice(coupon.minAmount) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center text-zinc-600">
                    {coupon.usedCount}
                    {coupon.maxUses > 0 ? ` / ${coupon.maxUses}` : ""}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-zinc-600">
                    {formatDate(coupon.startDate)} – {formatDate(coupon.endDate)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        !coupon.active
                          ? "bg-zinc-200 text-zinc-600"
                          : expired
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {!coupon.active ? "Pasif" : expired ? "Süresi doldu" : "Aktif"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setModal({
                            id: coupon.id,
                            code: coupon.code,
                            discountPercent: coupon.discountPercent,
                            minAmount: coupon.minAmount,
                            maxUses: coupon.maxUses,
                            startDate: toDateInput(coupon.startDate),
                            endDate: toDateInput(coupon.endDate),
                            active: coupon.active,
                          })
                        }
                        className="inline-flex items-center gap-1 text-xs text-amz-link hover:text-amz-link-hover"
                      >
                        <Pencil className="size-3.5" /> Düzenle
                      </button>
                      <DeleteButton endpoint={`/api/coupons/${coupon.id}`} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-90 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
          <div className="animate-fade-in max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">
                {modal.id ? "Kuponu düzenle" : "Yeni kupon"}
              </h2>
              <button type="button" onClick={() => setModal(null)} aria-label="Kapat">
                <X className="size-5 text-zinc-500" />
              </button>
            </div>

            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Kupon kodu *
                </label>
                <input
                  required
                  value={modal.code}
                  onChange={(e) => setModal({ ...modal, code: e.target.value.toUpperCase() })}
                  className="input-amz font-mono"
                  placeholder="HOSGELDIN10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">
                    İndirim (%) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={90}
                    value={modal.discountPercent}
                    onChange={(e) =>
                      setModal({ ...modal, discountPercent: Number(e.target.value) })
                    }
                    className="input-amz"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">
                    Min. sepet (€)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={modal.minAmount}
                    onChange={(e) => setModal({ ...modal, minAmount: Number(e.target.value) })}
                    className="input-amz"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Maksimum kullanım (0 = sınırsız)
                </label>
                <input
                  type="number"
                  min={0}
                  value={modal.maxUses}
                  onChange={(e) => setModal({ ...modal, maxUses: Number(e.target.value) })}
                  className="input-amz"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Başlangıç</label>
                  <input
                    type="date"
                    required
                    value={modal.startDate}
                    onChange={(e) => setModal({ ...modal, startDate: e.target.value })}
                    className="input-amz"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Bitiş</label>
                  <input
                    type="date"
                    required
                    value={modal.endDate}
                    onChange={(e) => setModal({ ...modal, endDate: e.target.value })}
                    className="input-amz"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={modal.active}
                  onChange={(e) => setModal({ ...modal, active: e.target.checked })}
                  className="size-4 accent-amz-orange"
                />
                Aktif
              </label>

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="btn-amz flex-1">
                  {saving && <Spinner />} Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="btn-amz-outline flex-1"
                >
                  Vazgeç
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
