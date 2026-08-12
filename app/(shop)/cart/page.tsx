"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { EmptyState } from "@/components/ui/empty-state";
import { FullSpinner } from "@/components/ui/spinner";
import { useCart } from "@/components/providers/cart-provider";
import { useAuth } from "@/components/providers/auth-provider";
import {
  FREE_SHIPPING_LIMIT,
  calcShipping,
  finalPrice,
  formatPrice,
  round2,
} from "@/lib/utils";

export default function CartPage() {
  const { items, ready, count, subtotal, updateQty, remove, clear, lineKey } = useCart();
  const user = useAuth();
  const router = useRouter();

  if (!ready) return <FullSpinner label="Sepetiniz yükleniyor…" />;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-3 py-8">
        <EmptyState
          icon={<ShoppingCart className="size-14" />}
          title="Alışveriş sepetiniz boş"
          description="Beğendiğiniz ürünleri sepete ekleyerek alışverişe başlayın."
          actionLabel="Alışverişe başla"
          actionHref="/"
        />
      </div>
    );
  }

  const shipping = calcShipping(subtotal);
  const total = round2(subtotal + shipping);
  const remaining = round2(Math.max(0, FREE_SHIPPING_LIMIT - subtotal));

  function goCheckout() {
    router.push(user ? "/checkout" : "/login?redirect=/checkout");
  }

  return (
    <div className="mx-auto max-w-[1500px] px-2 py-4 sm:px-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Ürünler */}
        <div className="min-w-0 flex-1 rounded-lg bg-white p-3 sm:p-5">
          <div className="flex items-end justify-between border-b border-amz-border pb-3">
            <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Alışveriş Sepeti</h1>
            <button
              type="button"
              onClick={() => clear()}
              className="text-sm text-amz-link hover:text-amz-link-hover"
            >
              Sepeti boşalt
            </button>
          </div>

          {remaining > 0 && (
            <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Ücretsiz kargoya <strong>{formatPrice(remaining)}</strong> kaldı!
            </p>
          )}

          <ul className="divide-y divide-amz-border">
            {items.map((item) => {
              const key = lineKey(item);
              const unit = finalPrice(item.price, item.discountPercent);
              return (
                <li key={key} className="flex gap-3 py-4 sm:gap-4">
                  <Link
                    href={`/product/${item.slug}`}
                    className="relative size-24 shrink-0 overflow-hidden rounded bg-white sm:size-32"
                  >
                    <SafeImage
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="128px"
                      className="object-contain"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link
                      href={`/product/${item.slug}`}
                      className="line-clamp-2 text-sm font-medium text-zinc-900 hover:text-amz-link-hover sm:text-base"
                    >
                      {item.title}
                    </Link>

                    <div className="flex flex-wrap gap-x-3 text-xs text-zinc-600">
                      {item.color && <span>Renk: {item.color}</span>}
                      {item.size && <span>Beden: {item.size}</span>}
                    </div>

                    <p className="text-xs text-amz-success">
                      {item.stock > 0 ? "Stokta var" : "Stokta yok"}
                    </p>

                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                      <div className="flex items-center rounded-full border border-amz-border bg-white">
                        <button
                          type="button"
                          onClick={() => updateQty(key, item.qty - 1)}
                          className="rounded-l-full px-2.5 py-1.5 hover:bg-amz-light"
                          aria-label="Adet azalt"
                        >
                          {item.qty === 1 ? (
                            <Trash2 className="size-4 text-amz-price" />
                          ) : (
                            <Minus className="size-4" />
                          )}
                        </button>
                        <span className="min-w-8 text-center text-sm font-medium">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(key, item.qty + 1)}
                          disabled={item.qty >= Math.max(1, item.stock)}
                          className="rounded-r-full px-2.5 py-1.5 hover:bg-amz-light disabled:opacity-40"
                          aria-label="Adet artır"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(key)}
                        className="text-sm text-amz-link hover:text-amz-link-hover"
                      >
                        Sil
                      </button>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-bold text-zinc-900">{formatPrice(unit * item.qty)}</p>
                    {item.qty > 1 && (
                      <p className="text-xs text-zinc-500">{formatPrice(unit)} / adet</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="border-t border-amz-border pt-3 text-right text-base text-zinc-900 sm:text-lg">
            Ara toplam ({count} ürün):{" "}
            <strong className="font-bold">{formatPrice(subtotal)}</strong>
          </p>
        </div>

        {/* Özet */}
        <aside className="w-full shrink-0 lg:sticky lg:top-32 lg:w-80">
          <div className="space-y-3 rounded-lg bg-white p-4">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-600">Ara toplam</dt>
                <dd className="font-medium">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-600">Kargo</dt>
                <dd className="font-medium">
                  {shipping === 0 ? (
                    <span className="text-amz-success">Ücretsiz</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </dd>
              </div>
              <div className="flex justify-between border-t border-amz-border pt-2 text-lg">
                <dt className="font-bold">Toplam</dt>
                <dd className="font-bold text-amz-price">{formatPrice(total)}</dd>
              </div>
            </dl>

            <button type="button" onClick={goCheckout} className="btn-amz w-full">
              Alışverişi tamamla
            </button>

            <Link href="/" className="btn-amz-outline w-full">
              Alışverişe devam et
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
