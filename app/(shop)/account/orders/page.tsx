import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getUserOrders } from "@/lib/queries";
import { SafeImage } from "@/components/ui/safe-image";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  formatDate,
  formatPrice,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Siparişlerim" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/account/orders");

  const orders = await getUserOrders(user.id);

  return (
    <div className="mx-auto max-w-5xl px-3 py-6">
      <h1 className="mb-4 text-2xl font-bold text-zinc-900">Siparişlerim</h1>

      {orders.length === 0 ? (
        <EmptyState
          icon={<Package className="size-14" />}
          title="Henüz siparişiniz yok"
          description="Verdiğiniz siparişler burada listelenir."
          actionLabel="Alışverişe başla"
          actionHref="/"
        />
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="overflow-hidden rounded-lg border border-amz-border bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amz-border bg-amz-light px-4 py-3 text-xs text-zinc-600">
                <div className="flex flex-wrap gap-x-8 gap-y-2">
                  <div>
                    <p className="uppercase">Sipariş tarihi</p>
                    <p className="text-sm text-zinc-800">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="uppercase">Toplam</p>
                    <p className="text-sm text-zinc-800">{formatPrice(order.totalPrice)}</p>
                  </div>
                  <div>
                    <p className="uppercase">Alıcı</p>
                    <p className="text-sm text-zinc-800">{order.shippingAddress.fullName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="uppercase">Sipariş no</p>
                  <p className="text-sm text-zinc-800">{order.orderNumber}</p>
                </div>
              </div>

              <div className="p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      ORDER_STATUS_COLORS[order.status]
                    }`}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <span className="text-xs text-zinc-600">
                    Ödeme: {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                  </span>
                  {order.trackingNumber && (
                    <span className="text-xs text-zinc-600">
                      Kargo takip: {order.trackingNumber}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {order.items.slice(0, 4).map((item, i) => (
                    <Link
                      key={`${item.productId}-${i}`}
                      href={`/product/${item.slug}`}
                      className="flex min-w-0 items-center gap-2"
                    >
                      <div className="relative size-14 shrink-0 overflow-hidden rounded border border-amz-border bg-white">
                        <SafeImage
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="56px"
                          className="object-contain"
                        />
                      </div>
                      <span className="line-clamp-2 max-w-40 text-xs text-zinc-700 hover:text-amz-link-hover">
                        {item.title}
                      </span>
                    </Link>
                  ))}
                  {order.items.length > 4 && (
                    <span className="self-center text-xs text-zinc-500">
                      +{order.items.length - 4} ürün daha
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/account/orders/${order.id}`} className="btn-amz-outline">
                    Sipariş detayı
                  </Link>
                  {order.items[0] && (
                    <Link href={`/product/${order.items[0].slug}`} className="btn-amz-outline">
                      Tekrar satın al
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
