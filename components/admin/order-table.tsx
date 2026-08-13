"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  formatDateTime,
  formatPrice,
} from "@/lib/utils";

export type OrderRow = {
  id: string;
  orderNumber: string;
  userName: string;
  userEmail: string;
  itemCount: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
};

const STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENTS = ["UNPAID", "PAID", "REFUNDED", "FAILED"];

/** Seçim ve toplu durum güncellemesi içeren sipariş tablosu. */
export function OrderTable({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const allSelected = orders.length > 0 && selected.length === orders.length;

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function run(body: { status?: string; paymentStatus?: string }) {
    if (selected.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "İşlem başarısız");
      toast(`${data.count} sipariş güncellendi`);
      setSelected([]);
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="animate-fade-in sticky top-0 z-20 flex flex-wrap items-center gap-2 rounded-lg border border-amz-orange bg-amber-50 p-3">
          <span className="mr-1 text-sm font-medium text-zinc-800">
            {selected.length} sipariş seçildi
          </span>
          {busy && <Spinner className="size-4" />}

          <select
            defaultValue=""
            disabled={busy}
            onChange={(e) => {
              if (e.target.value) run({ status: e.target.value });
              e.target.value = "";
            }}
            className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs"
          >
            <option value="">Sipariş durumu ata…</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          <select
            defaultValue=""
            disabled={busy}
            onChange={(e) => {
              if (e.target.value) run({ paymentStatus: e.target.value });
              e.target.value = "";
            }}
            className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs"
          >
            <option value="">Ödeme durumu ata…</option>
            {PAYMENTS.map((p) => (
              <option key={p} value={p}>
                {PAYMENT_STATUS_LABELS[p]}
              </option>
            ))}
          </select>

          <span className="text-xs text-zinc-500">
            İptale çekilen siparişlerde stoklar otomatik iade edilir.
          </span>

          <button
            type="button"
            onClick={() => setSelected([])}
            className="ml-auto inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900"
          >
            <X className="size-3.5" /> Seçimi temizle
          </button>
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
                  onChange={() => setSelected(allSelected ? [] : orders.map((o) => o.id))}
                  aria-label="Tümünü seç"
                  className="size-4 accent-amz-orange"
                />
              </th>
              <th className="px-3 py-2.5">Sipariş no</th>
              <th className="px-3 py-2.5">Müşteri</th>
              <th className="px-3 py-2.5">Tarih</th>
              <th className="px-3 py-2.5 text-center">Ürün</th>
              <th className="px-3 py-2.5">Ödeme</th>
              <th className="px-3 py-2.5">Durum</th>
              <th className="px-3 py-2.5 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-zinc-500">
                  Sipariş bulunamadı.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr
                key={order.id}
                className={selected.includes(order.id) ? "bg-amber-50/60" : "hover:bg-zinc-50"}
              >
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.includes(order.id)}
                    onChange={() => toggle(order.id)}
                    aria-label={`${order.orderNumber} seç`}
                    className="size-4 accent-amz-orange"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium text-amz-link hover:text-amz-link-hover"
                  >
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <p className="text-zinc-900">{order.userName}</p>
                  <p className="text-xs text-zinc-500">{order.userEmail}</p>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-zinc-600">
                  {formatDateTime(order.createdAt)}
                </td>
                <td className="px-3 py-2.5 text-center text-zinc-600">{order.itemCount}</td>
                <td className="px-3 py-2.5">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] ${
                      PAYMENT_STATUS_COLORS[order.paymentStatus]
                    }`}
                  >
                    {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                  </span>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {order.paymentMethod === "cod" ? "Kapıda" : "Stripe"}
                  </p>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] ${
                      ORDER_STATUS_COLORS[order.status]
                    }`}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-semibold">
                  {formatPrice(order.totalPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
