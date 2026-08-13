import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getOrderById } from "@/lib/queries";
import { SafeImage } from "@/components/ui/safe-image";
import { CancelOrderButton, PaymentVerifier } from "@/components/order/order-actions";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  formatDateTime,
  formatPrice,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Sipariş detayı" };
export const dynamic = "force-dynamic";

const STEPS = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const sp = await searchParams;

  const order = await getOrderById(id, user.role === "ADMIN" ? undefined : user.id);
  if (!order) notFound();

  const sessionId = typeof sp.session_id === "string" ? sp.session_id : null;
  const justPlaced = sp.placed === "1";
  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const canCancel = !["SHIPPED", "DELIVERED", "CANCELLED"].includes(order.status);

  return (
    <div className="mx-auto max-w-4xl px-3 py-6">
      <Link href="/account/orders" className="text-sm text-amz-link hover:text-amz-link-hover">
        ‹ Siparişlerime dön
      </Link>

      <h1 className="mb-4 mt-2 text-2xl font-bold text-zinc-900">Sipariş detayı</h1>

      {sessionId && (
        <PaymentVerifier orderId={order.id} sessionId={sessionId} isPaid={order.isPaid} />
      )}

      {(justPlaced || (sessionId && order.isPaid)) && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">Siparişiniz alındı!</p>
            <p>Sipariş numaranız: {order.orderNumber}</p>
          </div>
        </div>
      )}

      {/* Üst bilgi */}
      <div className="mb-4 rounded-lg border border-amz-border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-zinc-500">Sipariş numarası</p>
            <p className="font-semibold text-zinc-900">{order.orderNumber}</p>
            <p className="mt-1 text-sm text-zinc-600">{formatDateTime(order.createdAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                ORDER_STATUS_COLORS[order.status]
              }`}
            >
              {ORDER_STATUS_LABELS[order.status]}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                PAYMENT_STATUS_COLORS[order.paymentStatus]
              }`}
            >
              {PAYMENT_STATUS_LABELS[order.paymentStatus]}
            </span>
          </div>
        </div>

        {/* İlerleme çubuğu */}
        {order.status !== "CANCELLED" && (
          <div className="mt-5 flex items-center">
            {STEPS.map((step, i) => (
              <div key={step} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                      i <= stepIndex
                        ? "bg-amz-success text-white"
                        : "bg-zinc-200 text-zinc-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="hidden text-[11px] text-zinc-600 sm:block">
                    {ORDER_STATUS_LABELS[step]}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <span
                    className={`mx-1 h-0.5 flex-1 ${
                      i < stepIndex ? "bg-amz-success" : "bg-zinc-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {order.trackingNumber && (
          <p className="mt-4 rounded bg-amz-light px-3 py-2 text-sm text-zinc-700">
            Kargo takip numarası: <strong>{order.trackingNumber}</strong>
          </p>
        )}

        {canCancel && (
          <div className="mt-4 border-t border-amz-border pt-3">
            <CancelOrderButton orderId={order.id} />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Adres */}
        <div className="rounded-lg border border-amz-border bg-white p-4 text-sm">
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
        </div>

        {/* Özet */}
        <div className="rounded-lg border border-amz-border bg-white p-4 text-sm">
          <h2 className="mb-2 font-bold text-zinc-900">Ödeme özeti</h2>
          <dl className="space-y-1">
            <div className="flex justify-between">
              <dt className="text-zinc-600">Ürünler</dt>
              <dd>{formatPrice(order.itemsPrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-600">Kargo</dt>
              <dd>{order.shippingPrice === 0 ? "Ücretsiz" : formatPrice(order.shippingPrice)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-amz-success">
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
            <div className="flex justify-between border-t border-amz-border pt-1.5 text-base font-bold text-amz-price">
              <dt>Toplam</dt>
              <dd>{formatPrice(order.totalPrice)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-zinc-500">
            Ödeme yöntemi:{" "}
            {order.paymentMethod === "cod" ? "Kapıda ödeme" : "Kredi/banka kartı (Stripe)"}
          </p>
        </div>
      </div>

      {/* Ürünler */}
      <div className="mt-4 rounded-lg border border-amz-border bg-white p-4">
        <h2 className="mb-2 font-bold text-zinc-900">Sipariş içeriği</h2>
        <ul className="divide-y divide-amz-border">
          {order.items.map((item, i) => (
            <li key={`${item.productId}-${i}`} className="flex gap-3 py-3">
              <Link
                href={`/product/${item.slug}`}
                className="relative size-16 shrink-0 overflow-hidden rounded border border-amz-border bg-white"
              >
                <SafeImage
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="64px"
                  className="object-contain"
                />
              </Link>
              <div className="min-w-0 flex-1 text-sm">
                <Link
                  href={`/product/${item.slug}`}
                  className="line-clamp-2 text-zinc-900 hover:text-amz-link-hover"
                >
                  {item.title}
                </Link>
                <p className="text-zinc-500">
                  {item.qty} adet × {formatPrice(item.price)}
                  {item.color ? ` · ${item.color}` : ""}
                  {item.size ? ` · ${item.size}` : ""}
                </p>
              </div>
              <p className="shrink-0 font-semibold text-zinc-900">
                {formatPrice(item.price * item.qty)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {order.note && (
        <p className="mt-4 rounded-lg border border-amz-border bg-white p-4 text-sm text-zinc-700">
          <strong>Sipariş notu:</strong> {order.note}
        </p>
      )}
    </div>
  );
}
