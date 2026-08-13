import Link from "next/link";
import { Suspense } from "react";
import { Download } from "lucide-react";
import prisma from "@/lib/prisma";
import type { Prisma, OrderStatus } from "@prisma/client";
import { AdminSearch } from "@/components/admin/admin-search";
import { OrderTable } from "@/components/admin/order-table";
import { Pagination } from "@/components/ui/pagination";
import { ORDER_STATUS_LABELS, formatPrice } from "@/lib/utils";

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
  const q = typeof sp.q === "string" ? sp.q : "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(STATUSES.includes(status as OrderStatus) ? { status: status as OrderStatus } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" } },
            { trackingNumber: { contains: q, mode: "insensitive" } },
            { user: { is: { name: { contains: q, mode: "insensitive" } } } },
            { user: { is: { email: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  const [orders, total, counts, revenue] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.aggregate({ where, _sum: { totalPrice: true } }),
  ]);

  const countBy = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const query = q ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Siparişler</h1>
          <p className="text-sm text-zinc-600">
            {total} sipariş · {formatPrice(revenue._sum.totalPrice ?? 0)} toplam tutar
          </p>
        </div>
        <a href="/api/admin/export?type=orders" className="btn-amz-outline">
          <Download className="size-4" /> CSV indir
        </a>
      </div>

      <Suspense fallback={null}>
        <AdminSearch placeholder="Sipariş no, takip no, müşteri ara…" />
      </Suspense>

      {/* Durum filtresi */}
      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        <Link
          href={`/admin/orders${q ? `?q=${encodeURIComponent(q)}` : ""}`}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
            !status ? "border-amz-orange bg-amz-orange font-medium" : "border-zinc-300 bg-white"
          }`}
        >
          Tümü
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}${query}`}
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

      <OrderTable
        orders={orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          userName: order.user.name,
          userEmail: order.user.email,
          itemCount: order.items.length,
          totalPrice: order.totalPrice,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt.toISOString(),
        }))}
      />

      <Suspense fallback={null}>
        <Pagination page={page} pages={pages} />
      </Suspense>
    </div>
  );
}
