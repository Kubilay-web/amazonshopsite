"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/utils";

const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED", "FAILED"];

export function OrderStatusForm({
  orderId,
  status,
  paymentStatus,
  trackingNumber,
}: {
  orderId: string;
  status: string;
  paymentStatus: string;
  trackingNumber: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    status,
    paymentStatus,
    trackingNumber: trackingNumber ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Güncellenemedi");
      toast("Sipariş güncellendi");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
      <h2 className="font-bold text-zinc-900">Sipariş yönetimi</h2>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Sipariş durumu</label>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="input-amz"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {form.status === "CANCELLED" && status !== "CANCELLED" && (
          <p className="mt-1 text-xs text-amber-700">
            İptal edildiğinde ürün stokları geri yüklenir.
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Ödeme durumu</label>
        <select
          value={form.paymentStatus}
          onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
          className="input-amz"
        >
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Kargo takip numarası
        </label>
        <input
          value={form.trackingNumber}
          onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })}
          className="input-amz"
          placeholder="Örn. 1234567890"
        />
      </div>

      <button type="submit" disabled={saving} className="btn-amz w-full">
        {saving && <Spinner />} Kaydet
      </button>
    </form>
  );
}
