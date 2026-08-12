import Link from "next/link";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import type { Prisma, OrderStatus } from "@prisma/client";
import { Pagination } from "@/components/ui/pagination";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  formatDateTime,
  formatPrice,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;
const STATUSES: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where: Prisma.OrderWhereInput = STATUSES.includes(status as OrderStatus)
    ? { status: status as OrderStatus }
    : {};

  const [orders, total, counts] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countBy = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Siparişler</h1>
        <p className="text-sm text-zinc-600">{total} sipariş</p>
      </div>

      {/* Durum filtresi */}
      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        <Link
          href="/admin/orders"
          className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
            !status ? "border-amz-orange bg-amz-orange font-medium" : "border-zinc-300 bg-white"
          }`}
        >
          Tümü
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
              status === s
                ? "border-amz-orange bg-amz-orange font-medium"
                : "border-zinc-300 bg-white"
            }`}
          >
            {ORDER_STATUS_LABELS[s]} ({countBy[s] ?? 0})
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-200 text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
            <tr>
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
                <td colSpan={7} className="px-3 py-8 text-center text-zinc-500">
                  Sipariş bulunamadı.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-zinc-50">
                <td className="px-3 py-2.5">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium text-amz-link hover:text-amz-link-hover"
                  >
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <p className="text-zinc-900">{order.user.name}</p>
                  <p className="text-xs text-zinc-500">{order.user.email}</p>
                </td>
                <td className="px-3 py-2.5 text-zinc-600">{formatDateTime(order.createdAt)}</td>
                <td className="px-3 py-2.5 text-center text-zinc-600">{order.items.length}</td>
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

      <Suspense fallback={null}>
        <Pagination page={page} pages={pages} />
      </Suspense>
    </div>
  );
}
