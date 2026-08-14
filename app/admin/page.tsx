import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BadgeEuro,
  Boxes,
  Clock,
  CreditCard,
  DollarSign,
  MessageSquare,
  Package,
  ShoppingBag,
  Star,
  TrendingUp,
  Truck,
  UserPlus,
  Users,
} from "lucide-react";
import { getAdminOverview } from "@/lib/admin-queries";
import { getTodayTraffic } from "@/lib/analytics-queries";
import { getSettings } from "@/lib/settings";
import { StatCard } from "@/components/admin/stat-card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { SafeImage } from "@/components/ui/safe-image";
import { Rating } from "@/components/ui/rating";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  formatDateTime,
  formatPrice,
  truncate,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const settings = await getSettings();
  const [stats, today] = await Promise.all([
    getAdminOverview(settings.lowStockThreshold),
    getTodayTraffic(),
  ]);

  const alerts = [
    stats.pendingOrders > 0
      ? {
          href: "/admin/orders?status=PENDING",
          text: `${stats.pendingOrders} sipariş onay bekliyor`,
          tone: "bg-amber-50 text-amber-800 border-amber-200",
        }
      : null,
    stats.outOfStock > 0
      ? {
          href: "/admin/inventory?filter=out",
          text: `${stats.outOfStock} ürünün stoğu tükendi`,
          tone: "bg-rose-50 text-rose-800 border-rose-200",
        }
      : null,
    stats.lowStock > 0
      ? {
          href: "/admin/inventory?filter=low",
          text: `${stats.lowStock} üründe kritik stok`,
          tone: "bg-orange-50 text-orange-800 border-orange-200",
        }
      : null,
    stats.unpaidOrders > 0
      ? {
          href: "/admin/orders",
          text: `${stats.unpaidOrders} siparişin ödemesi alınmadı`,
          tone: "bg-zinc-50 text-zinc-700 border-zinc-200",
        }
      : null,
    settings.maintenanceMode
      ? {
          href: "/admin/settings",
          text: "Bakım modu açık — mağaza ziyaretçilere kapalı",
          tone: "bg-rose-100 text-rose-900 border-rose-300",
        }
      : null,
  ].filter(Boolean) as { href: string; text: string; tone: string }[];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Panel</h1>
          <p className="text-sm text-zinc-600">
            {settings.siteName} · mağazanın anlık durumu
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/products/new" className="btn-amz">
            <Package className="size-4" /> Yeni ürün
          </Link>
          <Link href="/admin/reports" className="btn-amz-outline">
            <TrendingUp className="size-4" /> Raporlar
          </Link>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((alert) => (
            <Link
              key={alert.text}
              href={alert.href}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition hover:brightness-97 ${alert.tone}`}
            >
              {alert.text}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Toplam ciro"
          value={formatPrice(stats.revenue)}
          hint={`${stats.paidOrderCount} ödenmiş sipariş`}
          icon={DollarSign}
          tone="emerald"
        />
        <StatCard
          label="Son 30 gün"
          value={formatPrice(stats.monthRevenue)}
          hint="önceki 30 güne göre"
          icon={TrendingUp}
          tone="blue"
          trend={stats.growth}
        />
        <StatCard
          label="Ortalama sepet"
          value={formatPrice(stats.avgOrderValue)}
          icon={BadgeEuro}
          tone="indigo"
        />
        <StatCard
          label="Sipariş"
          value={String(stats.orderCount)}
          hint={`${stats.shippedOrders} kargoda`}
          icon={ShoppingBag}
          tone="indigo"
          href="/admin/orders"
        />
        <StatCard
          label="Ürün"
          value={String(stats.productCount)}
          hint={`${stats.activeProducts} yayında`}
          icon={Package}
          tone="amber"
          href="/admin/products"
        />
        <StatCard
          label="Kullanıcı"
          value={String(stats.userCount)}
          hint={`30 günde +${stats.newUsers30}`}
          icon={Users}
          tone="violet"
          href="/admin/users"
        />
        <StatCard
          label="Bekleyen sipariş"
          value={String(stats.pendingOrders)}
          icon={Clock}
          tone="orange"
          href="/admin/orders?status=PENDING"
        />
        <StatCard
          label={`Kritik stok (≤${settings.lowStockThreshold})`}
          value={String(stats.lowStock + stats.outOfStock)}
          hint={`${stats.outOfStock} tükendi`}
          icon={AlertTriangle}
          tone="rose"
          href="/admin/inventory?filter=low"
        />
        <StatCard
          label="Yorum"
          value={String(stats.reviewCount)}
          icon={MessageSquare}
          tone="zinc"
          href="/admin/reviews"
        />
        <StatCard
          label="Aktif kupon"
          value={String(stats.couponCount)}
          icon={CreditCard}
          tone="zinc"
          href="/admin/coupons"
        />
        <StatCard
          label="Kategori"
          value={String(stats.categoryCount)}
          icon={Boxes}
          tone="zinc"
          href="/admin/categories"
        />
        <StatCard
          label="Aktif banner"
          value={String(stats.bannerCount)}
          icon={UserPlus}
          tone="zinc"
          href="/admin/banners"
        />
        <StatCard
          label="Bugünkü ziyaretçi"
          value={String(today.visitors)}
          hint={`${today.views} sayfa görüntüleme`}
          icon={Activity}
          tone="indigo"
          href="/admin/analytics"
        />
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-bold text-zinc-900">Son 14 günün cirosu</h2>
        <RevenueChart days={stats.days} />
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Son siparişler */}
        <section className="rounded-lg border border-zinc-200 bg-white xl:col-span-2">
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

        <div className="space-y-4">
          {/* Kritik stok */}
          <section className="rounded-lg border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 p-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-zinc-900">
                <Truck className="size-4 text-rose-600" /> Stoğu azalanlar
              </h2>
              <Link
                href="/admin/inventory?filter=low"
                className="text-sm text-amz-link hover:text-amz-link-hover"
              >
                Yönet
              </Link>
            </div>
            {stats.lowStockProducts.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">Kritik stokta ürün yok.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {stats.lowStockProducts.map((product) => (
                  <li key={product.id} className="flex items-center gap-3 p-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded border border-zinc-200 bg-white">
                      <SafeImage
                        src={product.images[0]}
                        alt={product.title}
                        fill
                        sizes="40px"
                        className="object-contain"
                      />
                    </div>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="min-w-0 flex-1 text-sm text-zinc-800 hover:text-amz-link"
                    >
                      {truncate(product.title, 42)}
                    </Link>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        product.stock <= 0
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {product.stock}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Son yorumlar */}
          <section className="rounded-lg border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 p-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-zinc-900">
                <Star className="size-4 text-amz-star" /> Son yorumlar
              </h2>
              <Link
                href="/admin/reviews"
                className="text-sm text-amz-link hover:text-amz-link-hover"
              >
                Tümü
              </Link>
            </div>
            {stats.recentReviews.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">Henüz yorum yok.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {stats.recentReviews.map((review) => (
                  <li key={review.id} className="p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <Rating value={review.rating} size="sm" />
                      <span className="text-xs text-zinc-500">{review.user.name}</span>
                    </div>
                    <Link
                      href={`/product/${review.product.slug}`}
                      className="text-xs text-amz-link hover:text-amz-link-hover"
                    >
                      {truncate(review.product.title, 40)}
                    </Link>
                    <p className="mt-0.5 text-sm text-zinc-600">
                      {truncate(review.comment, 80)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
