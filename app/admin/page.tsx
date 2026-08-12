import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { getDashboardStats } from "@/lib/queries";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  formatDateTime,
  formatPrice,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const stats = await getDashboardStats();
  const maxDay = Math.max(...stats.days.map((d) => d.total), 1);

  const cards = [
    {
      label: "Toplam ciro",
      value: formatPrice(stats.revenue),
      icon: DollarSign,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Son 30 gün",
      value: formatPrice(stats.monthRevenue),
      icon: TrendingUp,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "Sipariş",
      value: String(stats.orderCount),
      icon: ShoppingBag,
      tone: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Ürün",
      value: String(stats.productCount),
      icon: Package,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Kullanıcı",
      value: String(stats.userCount),
      icon: Users,
      tone: "bg-violet-50 text-violet-700",
    },
    {
      label: "Bekleyen sipariş",
      value: String(stats.pendingOrders),
      icon: Clock,
      tone: "bg-orange-50 text-orange-700",
    },
    {
      label: "Kritik stok (≤5)",
      value: String(stats.lowStock),
      icon: AlertTriangle,
      tone: "bg-rose-50 text-rose-700",
    },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-zinc-900">Panel</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className={`mb-2 inline-flex rounded-lg p-2 ${card.tone}`}>
              <card.icon className="size-5" />
            </div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">{card.label}</p>
            <p className="text-xl font-bold text-zinc-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Günlük ciro grafiği */}
      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-4 text-lg font-bold text-zinc-900">Son 14 günün cirosu</h2>
        <div className="flex h-48 items-end gap-1.5 sm:gap-2">
          {stats.days.map((day) => (
            <div key={day.date} className="group flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-zinc-500 opacity-0 transition group-hover:opacity-100">
                {formatPrice(day.total)}
              </span>
              <div
                className="w-full rounded-t bg-amz-orange/80 transition hover:bg-amz-orange"
                style={{ height: `${Math.max(2, (day.total / maxDay) * 100)}%` }}
                title={`${day.date}: ${formatPrice(day.total)}`}
              />
              <span className="text-[10px] text-zinc-500">{day.date.slice(8)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Son siparişler */}
      <section className="rounded-lg border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 p-4">
          <h2 className="text-lg font-bold text-zinc-900">Son siparişler</h2>
          <Link href="/admin/orders" className="text-sm text-amz-link hover:text-amz-link-hover">
            Tümünü gör
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">Henüz sipariş yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-2.5">Sipariş</th>
                  <th className="px-4 py-2.5">Müşteri</th>
                  <th className="px-4 py-2.5">Tarih</th>
                  <th className="px-4 py-2.5">Durum</th>
                  <th className="px-4 py-2.5 text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-amz-link hover:text-amz-link-hover"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="text-zinc-900">{order.user.name}</p>
                      <p className="text-xs text-zinc-500">{order.user.email}</p>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-600">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${
                          ORDER_STATUS_COLORS[order.status]
                        }`}
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold">
                      {formatPrice(order.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
