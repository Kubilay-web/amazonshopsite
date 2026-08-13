import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  MapPin,
  MessageSquare,
  ShoppingBag,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { getCustomerDetail } from "@/lib/admin-queries";
import { getCurrentUser } from "@/lib/auth";
import { StatCard } from "@/components/admin/stat-card";
import { UserActions } from "@/components/admin/user-actions";
import { SafeImage } from "@/components/ui/safe-image";
import { Rating } from "@/components/ui/rating";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  formatDate,
  formatDateTime,
  formatPrice,
  isValidObjectId,
  truncate,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  const [me, detail] = await Promise.all([getCurrentUser(), getCustomerDetail(id)]);
  if (!detail) notFound();

  const { user, orders, reviews, wishlist, stats } = detail;

  return (
    <div className="space-y-4">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-amz-link hover:text-amz-link-hover"
      >
        <ArrowLeft className="size-4" /> Kullanıcılara dön
      </Link>

      {/* Kimlik kartı */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-lg font-bold text-zinc-600">
            {user.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">{user.name}</h1>
            <p className="text-sm text-zinc-600">{user.email}</p>
            <p className="text-xs text-zinc-500">
              {user.phone ? `${user.phone} · ` : ""}
              {formatDate(user.createdAt)} tarihinde katıldı
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              user.role === "ADMIN"
                ? "bg-amber-100 text-amber-700"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {user.role === "ADMIN" ? "Yönetici" : "Kullanıcı"}
          </span>
          {user.blocked && (
            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
              Askıda
            </span>
          )}
          <UserActions
            userId={user.id}
            role={user.role}
            blocked={user.blocked}
            isSelf={me?.id === user.id}
          />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Toplam harcama"
          value={formatPrice(stats.spent)}
          icon={Wallet}
          tone="emerald"
        />
        <StatCard
          label="Ödenmiş sipariş"
          value={String(stats.paidOrders)}
          icon={ShoppingBag}
          tone="indigo"
        />
        <StatCard
          label="Ortalama sepet"
          value={formatPrice(stats.avgOrder)}
          icon={Wallet}
          tone="blue"
        />
        <StatCard
          label="Sepetteki ürün"
          value={String(stats.cartItems)}
          icon={ShoppingCart}
          tone="amber"
        />
        <StatCard label="Yorum" value={String(reviews.length)} icon={MessageSquare} tone="violet" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Siparişler */}
        <section className="rounded-lg border border-zinc-200 bg-white lg:col-span-2">
          <h2 className="border-b border-zinc-200 p-4 text-lg font-bold text-zinc-900">
            Siparişler ({orders.length})
          </h2>
          {orders.length === 0 ? (
            <p className="p-5 text-sm text-zinc-500">Bu kullanıcı henüz sipariş vermemiş.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-150 text-sm">
                <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-3 py-2.5">Sipariş</th>
                    <th className="px-3 py-2.5">Tarih</th>
                    <th className="px-3 py-2.5 text-center">Ürün</th>
                    <th className="px-3 py-2.5">Ödeme</th>
                    <th className="px-3 py-2.5">Durum</th>
                    <th className="px-3 py-2.5 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
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
                      <td className="whitespace-nowrap px-3 py-2.5 text-zinc-600">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-3 py-2.5 text-center text-zinc-600">
                        {order.items.length}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] ${
                            PAYMENT_STATUS_COLORS[order.paymentStatus]
                          }`}
                        >
                          {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                        </span>
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
          )}
        </section>

        <div className="space-y-4">
          {/* Adresler */}
          <section className="rounded-lg border border-zinc-200 bg-white">
            <h2 className="flex items-center gap-2 border-b border-zinc-200 p-4 text-base font-bold text-zinc-900">
              <MapPin className="size-4 text-zinc-500" /> Adresler ({user.addresses.length})
            </h2>
            {user.addresses.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">Kayıtlı adres yok.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {user.addresses.map((address) => (
                  <li key={address.id} className="p-3 text-sm">
                    <p className="font-medium text-zinc-900">
                      {address.fullName}
                      {address.isDefault && (
                        <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700">
                          Varsayılan
                        </span>
                      )}
                    </p>
                    <p className="text-zinc-600">
                      {address.addressLine1}
                      {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                    </p>
                    <p className="text-zinc-600">
                      {address.postalCode} {address.state} / {address.city} — {address.country}
                    </p>
                    <p className="text-xs text-zinc-500">{address.phone}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Sepet */}
          <section className="rounded-lg border border-zinc-200 bg-white">
            <h2 className="flex items-center gap-2 border-b border-zinc-200 p-4 text-base font-bold text-zinc-900">
              <ShoppingCart className="size-4 text-zinc-500" /> Aktif sepet
            </h2>
            {!user.cart || user.cart.items.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">Sepet boş.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {user.cart.items.map((item, index) => (
                  <li key={`${item.productId}-${index}`} className="flex items-center gap-3 p-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded border border-zinc-200 bg-white">
                      <SafeImage
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="40px"
                        className="object-contain"
                      />
                    </div>
                    <Link
                      href={`/product/${item.slug}`}
                      className="min-w-0 flex-1 text-sm text-zinc-800 hover:text-amz-link"
                    >
                      {truncate(item.title, 34)}
                    </Link>
                    <span className="shrink-0 text-xs text-zinc-500">×{item.qty}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Favoriler */}
          <section className="rounded-lg border border-zinc-200 bg-white">
            <h2 className="flex items-center gap-2 border-b border-zinc-200 p-4 text-base font-bold text-zinc-900">
              <Heart className="size-4 text-zinc-500" /> Favoriler ({wishlist.length})
            </h2>
            {wishlist.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">Favori ürün yok.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {wishlist.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 p-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded border border-zinc-200 bg-white">
                      <SafeImage
                        src={item.product.images[0]}
                        alt={item.product.title}
                        fill
                        sizes="40px"
                        className="object-contain"
                      />
                    </div>
                    <Link
                      href={`/admin/products/${item.product.id}`}
                      className="min-w-0 flex-1 text-sm text-zinc-800 hover:text-amz-link"
                    >
                      {truncate(item.product.title, 34)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Yorumlar */}
      <section className="rounded-lg border border-zinc-200 bg-white">
        <h2 className="border-b border-zinc-200 p-4 text-lg font-bold text-zinc-900">
          Yorumlar ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <p className="p-5 text-sm text-zinc-500">Bu kullanıcı henüz yorum yapmamış.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {reviews.map((review) => (
              <li key={review.id} className="p-4">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/admin/products/${review.product.id}`}
                    className="text-sm font-medium text-amz-link hover:text-amz-link-hover"
                  >
                    {review.product.title}
                  </Link>
                  <span className="text-xs text-zinc-500">
                    {formatDateTime(review.createdAt)}
                  </span>
                </div>
                <Rating value={review.rating} showCount={false} />
                {review.title && (
                  <p className="mt-1 font-medium text-zinc-900">{review.title}</p>
                )}
                <p className="text-sm text-zinc-600">{review.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
