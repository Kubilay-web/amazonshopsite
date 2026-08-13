import Link from "next/link";
import {
  BadgeEuro,
  Boxes,
  Download,
  Percent,
  ShoppingBag,
  Ticket,
  TrendingUp,
  Truck,
  UserPlus,
} from "lucide-react";
import { RANGE_LABELS, getSalesReport, parseRange, type RangeKey } from "@/lib/admin-queries";
import { StatCard } from "@/components/admin/stat-card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { SafeImage } from "@/components/ui/safe-image";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  formatPrice,
  truncate,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

const RANGES: RangeKey[] = ["7", "30", "90", "365"];

const EXPORTS = [
  { type: "orders", label: "Siparişler" },
  { type: "products", label: "Ürünler" },
  { type: "users", label: "Kullanıcılar" },
  { type: "reviews", label: "Yorumlar" },
  { type: "coupons", label: "Kuponlar" },
];

/** Yatay oranlı çubuk (kategori / durum kırılımları için). */
function ShareBar({ ratio, tone = "bg-amz-orange" }: { ratio: number; tone?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
    </div>
  );
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const range = parseRange(sp.range);
  const report = await getSalesReport(range);

  const maxCategoryRevenue = Math.max(...report.categoryBreakdown.map((c) => c.revenue), 1);
  const totalStatus = report.statusCounts.reduce((s, c) => s + c.count, 0) || 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Raporlar</h1>
          <p className="text-sm text-zinc-600">{RANGE_LABELS[range]} için satış analizi</p>
        </div>

        <div className="flex gap-2">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/reports?range=${r}`}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                r === range
                  ? "border-amz-orange bg-amz-orange font-medium"
                  : "border-zinc-300 bg-white hover:bg-zinc-50"
              }`}
            >
              {RANGE_LABELS[r]}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Ciro"
          value={formatPrice(report.revenue)}
          hint={`${report.paidCount} ödenmiş sipariş`}
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard
          label="Ortalama sepet"
          value={formatPrice(report.avgOrderValue)}
          icon={BadgeEuro}
          tone="blue"
        />
        <StatCard
          label="Sipariş"
          value={String(report.orderCount)}
          hint={`ödeme oranı %${report.conversion}`}
          icon={ShoppingBag}
          tone="indigo"
        />
        <StatCard
          label="Satılan adet"
          value={String(report.unitsSold)}
          icon={Boxes}
          tone="amber"
        />
        <StatCard
          label="Kargo geliri"
          value={formatPrice(report.shippingRevenue)}
          icon={Truck}
          tone="zinc"
        />
        <StatCard
          label="Kupon indirimi"
          value={formatPrice(report.discountTotal)}
          icon={Percent}
          tone="rose"
        />
        <StatCard
          label="Yeni kullanıcı"
          value={String(report.newUsers)}
          icon={UserPlus}
          tone="violet"
        />
        <StatCard
          label="Ödeme dağılımı"
          value={`${report.stripeOrders} / ${report.codOrders}`}
          hint="Stripe / Kapıda"
          icon={Ticket}
          tone="orange"
        />
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-bold text-zinc-900">Günlük ciro</h2>
        <RevenueChart days={report.days} height={220} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* En çok satan ürünler */}
        <section className="rounded-lg border border-zinc-200 bg-white">
          <h2 className="border-b border-zinc-200 p-4 text-lg font-bold text-zinc-900">
            En çok satan ürünler
          </h2>
          {report.topProducts.length === 0 ? (
            <p className="p-5 text-sm text-zinc-500">Bu aralıkta satış yok.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {report.topProducts.map((product, index) => (
                <li key={product.productId} className="flex items-center gap-3 p-3">
                  <span className="w-5 shrink-0 text-center text-sm font-bold text-zinc-400">
                    {index + 1}
                  </span>
                  <div className="relative size-10 shrink-0 overflow-hidden rounded border border-zinc-200 bg-white">
                    <SafeImage
                      src={product.image}
                      alt={product.title}
                      fill
                      sizes="40px"
                      className="object-contain"
                    />
                  </div>
                  <Link
                    href={`/product/${product.slug}`}
                    className="min-w-0 flex-1 text-sm text-zinc-800 hover:text-amz-link"
                  >
                    {truncate(product.title, 46)}
                  </Link>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-zinc-900">
                      {formatPrice(product.revenue)}
                    </p>
                    <p className="text-xs text-zinc-500">{product.qty} adet</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* En değerli müşteriler */}
        <section className="rounded-lg border border-zinc-200 bg-white">
          <h2 className="border-b border-zinc-200 p-4 text-lg font-bold text-zinc-900">
            En değerli müşteriler
          </h2>
          {report.topCustomers.length === 0 ? (
            <p className="p-5 text-sm text-zinc-500">Bu aralıkta ödenmiş sipariş yok.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {report.topCustomers.map((customer, index) => (
                <li key={customer.userId} className="flex items-center gap-3 p-3">
                  <span className="w-5 shrink-0 text-center text-sm font-bold text-zinc-400">
                    {index + 1}
                  </span>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-600">
                    {customer.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/users/${customer.userId}`}
                      className="block truncate text-sm font-medium text-zinc-900 hover:text-amz-link"
                    >
                      {customer.name}
                    </Link>
                    <p className="truncate text-xs text-zinc-500">{customer.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-zinc-900">
                      {formatPrice(customer.revenue)}
                    </p>
                    <p className="text-xs text-zinc-500">{customer.orders} sipariş</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Kategori kırılımı */}
        <section className="rounded-lg border border-zinc-200 bg-white">
          <h2 className="border-b border-zinc-200 p-4 text-lg font-bold text-zinc-900">
            Kategori kırılımı
          </h2>
          {report.categoryBreakdown.length === 0 ? (
            <p className="p-5 text-sm text-zinc-500">Veri yok.</p>
          ) : (
            <ul className="space-y-3 p-4">
              {report.categoryBreakdown.map((category) => (
                <li key={category.name}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate text-zinc-800">{category.name}</span>
                    <span className="shrink-0 font-semibold text-zinc-900">
                      {formatPrice(category.revenue)}
                      <span className="ml-2 text-xs font-normal text-zinc-500">
                        {category.qty} adet
                      </span>
                    </span>
                  </div>
                  <ShareBar ratio={category.revenue / maxCategoryRevenue} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Durum & ödeme dağılımı */}
        <section className="space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-white">
            <h2 className="border-b border-zinc-200 p-4 text-lg font-bold text-zinc-900">
              Sipariş durumu
            </h2>
            {report.statusCounts.length === 0 ? (
              <p className="p-5 text-sm text-zinc-500">Veri yok.</p>
            ) : (
              <ul className="space-y-3 p-4">
                {report.statusCounts.map((row) => (
                  <li key={row.status}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${
                          ORDER_STATUS_COLORS[row.status]
                        }`}
                      >
                        {ORDER_STATUS_LABELS[row.status]}
                      </span>
                      <span className="font-semibold text-zinc-900">
                        {row.count}
                        <span className="ml-2 text-xs font-normal text-zinc-500">
                          %{Math.round((row.count / totalStatus) * 100)}
                        </span>
                      </span>
                    </div>
                    <ShareBar ratio={row.count / totalStatus} tone="bg-indigo-400" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white">
            <h2 className="border-b border-zinc-200 p-4 text-lg font-bold text-zinc-900">
              Ödeme durumu
            </h2>
            <ul className="divide-y divide-zinc-100">
              {report.paymentCounts.length === 0 && (
                <li className="p-5 text-sm text-zinc-500">Veri yok.</li>
              )}
              {report.paymentCounts.map((row) => (
                <li key={row.status} className="flex items-center justify-between gap-3 p-3">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs ${
                      PAYMENT_STATUS_COLORS[row.status]
                    }`}
                  >
                    {PAYMENT_STATUS_LABELS[row.status]}
                  </span>
                  <span className="text-sm text-zinc-600">{row.count} sipariş</span>
                  <span className="text-sm font-semibold text-zinc-900">
                    {formatPrice(row.total)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* Kupon performansı */}
      <section className="rounded-lg border border-zinc-200 bg-white">
        <h2 className="border-b border-zinc-200 p-4 text-lg font-bold text-zinc-900">
          Kupon kullanımı
        </h2>
        {report.coupons.length === 0 ? (
          <p className="p-5 text-sm text-zinc-500">Henüz kullanılan kupon yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-125 text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-2.5">Kod</th>
                  <th className="px-4 py-2.5 text-right">İndirim</th>
                  <th className="px-4 py-2.5 text-right">Kullanım</th>
                  <th className="px-4 py-2.5 text-right">Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {report.coupons.map((coupon) => (
                  <tr key={coupon.code} className="hover:bg-zinc-50">
                    <td className="px-4 py-2.5 font-mono font-bold text-zinc-900">
                      {coupon.code}
                    </td>
                    <td className="px-4 py-2.5 text-right">%{coupon.discountPercent}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{coupon.usedCount}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-500">
                      {coupon.maxUses > 0 ? coupon.maxUses : "sınırsız"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* CSV dışa aktarım */}
      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-1 text-lg font-bold text-zinc-900">Dışa aktar</h2>
        <p className="mb-3 text-sm text-zinc-600">
          Verileri Excel uyumlu CSV olarak indirin (noktalı virgül ayraçlı, UTF-8).
        </p>
        <div className="flex flex-wrap gap-2">
          {EXPORTS.map((item) => (
            <a
              key={item.type}
              href={`/api/admin/export?type=${item.type}`}
              className="btn-amz-outline"
            >
              <Download className="size-4" /> {item.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
