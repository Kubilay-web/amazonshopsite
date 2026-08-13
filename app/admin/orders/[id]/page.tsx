import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { SafeImage } from "@/components/ui/safe-image";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { formatDateTime, formatPrice, isValidObjectId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });
  if (!order) notFound();

  return (
    <div className="space-y-4">
      <nav className="text-sm text-zinc-600">
        <Link href="/admin/orders" className="text-amz-link hover:text-amz-link-hover">
          Siparişler
        </Link>
        <span className="mx-1">›</span>
        <span>{order.orderNumber}</span>
      </nav>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold text-zinc-900">{order.orderNumber}</h1>
        <p className="text-sm text-zinc-600">{formatDateTime(order.createdAt)}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Ürünler */}
          <section className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="mb-3 font-bold text-zinc-900">Ürünler ({order.items.length})</h2>
            <ul className="divide-y divide-zinc-100">
              {order.items.map((item, i) => (
                <li key={`${item.productId}-${i}`} className="flex gap-3 py-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded border border-zinc-200 bg-white">
                    <SafeImage
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="64px"
                      className="object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <Link
                      href={`/product/${item.slug}`}
                      target="_blank"
                      className="line-clamp-2 text-zinc-900 hover:text-amz-link-hover"
                    >
                      {item.title}
                    </Link>
                    <p className="text-zinc-500">
                      {item.qty} × {formatPrice(item.price)}
                      {item.color ? ` · ${item.color}` : ""}
                      {item.size ? ` · ${item.size}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold">{formatPrice(item.price * item.qty)}</p>
                </li>
              ))}
            </ul>

            <dl className="mt-3 space-y-1 border-t border-zinc-200 pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-600">Ürünler</dt>
                <dd>{formatPrice(order.itemsPrice)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-600">Kargo</dt>
                <dd>{formatPrice(order.shippingPrice)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>İndirim {order.couponCode ? `(${order.couponCode})` : ""}</dt>
                  <dd>−{formatPrice(order.discount)}</dd>
                </div>
              )}
              {order.taxPrice > 0 && (
                <div className="flex justify-between">
                  <dt className="text-zinc-600">KDV</dt>
                  <dd>{formatPrice(order.taxPrice)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-200 pt-1.5 text-base font-bold">
                <dt>Toplam</dt>
                <dd>{formatPrice(order.totalPrice)}</dd>
              </div>
            </dl>
          </section>

          {order.note && (
            <section className="rounded-lg border border-zinc-200 bg-white p-4 text-sm">
              <h2 className="mb-1 font-bold text-zinc-900">Sipariş notu</h2>
              <p className="text-zinc-700">{order.note}</p>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <OrderStatusForm
            orderId={order.id}
            status={order.status}
            paymentStatus={order.paymentStatus}
            trackingNumber={order.trackingNumber}
          />

          <section className="rounded-lg border border-zinc-200 bg-white p-4 text-sm">
            <h2 className="mb-2 font-bold text-zinc-900">Müşteri</h2>
            <p className="text-zinc-900">{order.user.name}</p>
            <p className="text-zinc-600">{order.user.email}</p>
            {order.user.phone && <p className="text-zinc-600">{order.user.phone}</p>}
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4 text-sm">
            <h2 className="mb-2 font-bold text-zinc-900">Teslimat adresi</h2>
            <p className="font-medium text-zinc-800">{order.shippingAddress.fullName}</p>
            <p className="text-zinc-700">{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && (
              <p className="text-zinc-700">{order.shippingAddress.addressLine2}</p>
            )}
            <p className="text-zinc-700">
              {order.shippingAddress.state} / {order.shippingAddress.city}{" "}
              {order.shippingAddress.postalCode}
            </p>
            <p className="text-zinc-700">{order.shippingAddress.country}</p>
            <p className="mt-1 text-zinc-500">{order.shippingAddress.phone}</p>
          </section>

          {(order.stripeSessionId || order.paymentIntentId) && (
            <section className="rounded-lg border border-zinc-200 bg-white p-4 text-xs">
              <h2 className="mb-2 text-sm font-bold text-zinc-900">Stripe</h2>
              {order.stripeSessionId && (
                <p className="break-all text-zinc-600">Session: {order.stripeSessionId}</p>
              )}
              {order.paymentIntentId && (
                <p className="break-all text-zinc-600">Intent: {order.paymentIntentId}</p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
