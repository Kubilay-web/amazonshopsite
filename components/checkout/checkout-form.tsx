"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote, CreditCard, MapPin, Plus, Tag } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Spinner } from "@/components/ui/spinner";
import { useCart } from "@/components/providers/cart-provider";
import { useToast } from "@/components/providers/toast-provider";
import { useShopConfig } from "@/components/providers/shop-config-provider";
import { cn, calcShipping, calcTax, finalPrice, formatPrice, round2 } from "@/lib/utils";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

const EMPTY_ADDRESS = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Türkiye",
};

export function CheckoutForm({
  addresses,
  stripeEnabled,
}: {
  addresses: Address[];
  stripeEnabled: boolean;
}) {
  const router = useRouter();
  const { items, subtotal, ready, clear } = useCart();
  const { toast } = useToast();
  const config = useShopConfig();

  // Stripe hem .env'de yapılandırılmış hem de panelden açık olmalı
  const stripeAvailable = stripeEnabled && config.stripeEnabled;
  const codAvailable = config.codEnabled;

  const [addressId, setAddressId] = useState<string | null>(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null,
  );
  const [useNew, setUseNew] = useState(addresses.length === 0);
  const [newAddress, setNewAddress] = useState(EMPTY_ADDRESS);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "cod">(
    stripeAvailable ? "stripe" : "cod",
  );
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const discount = coupon?.discount ?? 0;
  const shipping = calcShipping(subtotal, config);
  const taxable = round2(Math.max(0, subtotal - discount));
  const tax = calcTax(taxable, config.taxRate);
  const total = round2(taxable + shipping + tax);
  const belowMinimum = config.minOrderAmount > 0 && subtotal < config.minOrderAmount;

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Kupon geçersiz");
      setCoupon({ code: data.code, discount: data.discount });
      toast(`%${data.discountPercent} indirim uygulandı`);
    } catch (error) {
      setCoupon(null);
      toast(error instanceof Error ? error.message : "Kupon uygulanamadı", "error");
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (items.length === 0) {
      toast("Sepetiniz boş", "error");
      return;
    }
    if (belowMinimum) {
      toast(`Minimum sipariş tutarı ${formatPrice(config.minOrderAmount)}`, "error");
      return;
    }
    setSubmitting(true);

    try {
      // Sunucudaki sepetin güncel olduğundan emin ol (debounce yarışını önler)
      await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            size: i.size,
            color: i.color,
          })),
        }),
      });

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: useNew ? null : addressId,
          shippingAddress: useNew ? newAddress : null,
          paymentMethod,
          couponCode: coupon?.code ?? "",
          note,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Sipariş oluşturulamadı");

      if (data.url) {
        window.location.href = data.url; // Stripe Checkout
        return;
      }

      // Kapıda ödeme: sipariş oluştu, sunucu sepeti boşalttı — istemciyi de sıfırla
      await clear();
      router.push(data.redirect ?? `/account/orders/${data.orderId}`);
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
      setSubmitting(false);
    }
  }

  if (ready && items.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center">
        <p className="text-zinc-700">Sepetiniz boş.</p>
        <Link href="/" className="btn-amz mt-4">
          Alışverişe başla
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1 space-y-4">
        {/* 1. Adres */}
        <section className="rounded-lg bg-white p-4 sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-zinc-900">
            <MapPin className="size-5" /> 1. Teslimat adresi
          </h2>

          <div className="space-y-2">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-lg border p-3 transition",
                  !useNew && addressId === address.id
                    ? "border-amz-orange bg-amz-orange/5"
                    : "border-amz-border hover:bg-amz-light",
                )}
              >
                <input
                  type="radio"
                  name="address"
                  checked={!useNew && addressId === address.id}
                  onChange={() => {
                    setUseNew(false);
                    setAddressId(address.id);
                  }}
                  className="mt-1 size-4 accent-amz-orange"
                />
                <div className="text-sm">
                  <p className="font-semibold text-zinc-900">
                    {address.fullName}
                    {address.isDefault && (
                      <span className="ml-2 rounded bg-amz-light px-1.5 py-0.5 text-[11px] font-normal text-zinc-600">
                        Varsayılan
                      </span>
                    )}
                  </p>
                  <p className="text-zinc-700">
                    {address.addressLine1}
                    {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                  </p>
                  <p className="text-zinc-700">
                    {address.state} / {address.city} {address.postalCode} · {address.country}
                  </p>
                  <p className="text-zinc-500">{address.phone}</p>
                </div>
              </label>
            ))}

            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition",
                useNew ? "border-amz-orange bg-amz-orange/5" : "border-amz-border hover:bg-amz-light",
              )}
            >
              <input
                type="radio"
                name="address"
                checked={useNew}
                onChange={() => setUseNew(true)}
                className="size-4 accent-amz-orange"
              />
              <Plus className="size-4" /> Yeni adres kullan
            </label>
          </div>

          {useNew && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="Ad Soyad"
                value={newAddress.fullName}
                onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                className="input-amz"
              />
              <input
                required
                placeholder="Telefon"
                value={newAddress.phone}
                onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                className="input-amz"
              />
              <input
                required
                placeholder="Adres satırı 1"
                value={newAddress.addressLine1}
                onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                className="input-amz sm:col-span-2"
              />
              <input
                placeholder="Adres satırı 2 (isteğe bağlı)"
                value={newAddress.addressLine2}
                onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                className="input-amz sm:col-span-2"
              />
              <input
                required
                placeholder="İlçe"
                value={newAddress.state}
                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                className="input-amz"
              />
              <input
                required
                placeholder="Şehir"
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                className="input-amz"
              />
              <input
                required
                placeholder="Posta kodu"
                value={newAddress.postalCode}
                onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                className="input-amz"
              />
              <input
                required
                placeholder="Ülke"
                value={newAddress.country}
                onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                className="input-amz"
              />
            </div>
          )}
        </section>

        {/* 2. Ödeme */}
        <section className="rounded-lg bg-white p-4 sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-zinc-900">
            <CreditCard className="size-5" /> 2. Ödeme yöntemi
          </h2>

          <div className="space-y-2">
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition",
                paymentMethod === "stripe"
                  ? "border-amz-orange bg-amz-orange/5"
                  : "border-amz-border hover:bg-amz-light",
                !stripeAvailable && "cursor-not-allowed opacity-50",
              )}
            >
              <input
                type="radio"
                name="payment"
                disabled={!stripeAvailable}
                checked={paymentMethod === "stripe"}
                onChange={() => setPaymentMethod("stripe")}
                className="mt-1 size-4 accent-amz-orange"
              />
              <div className="text-sm">
                <p className="flex items-center gap-2 font-semibold text-zinc-900">
                  <CreditCard className="size-4" /> Kredi / Banka kartı (Stripe)
                </p>
                <p className="text-zinc-600">
                  {stripeAvailable
                    ? "Güvenli Stripe ödeme sayfasına yönlendirilirsiniz."
                    : !config.stripeEnabled
                      ? "Kart ile ödeme şu anda kapalı."
                      : "Stripe anahtarları .env dosyasında tanımlı değil."}
                </p>
              </div>
            </label>

            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition",
                paymentMethod === "cod"
                  ? "border-amz-orange bg-amz-orange/5"
                  : "border-amz-border hover:bg-amz-light",
                !codAvailable && "cursor-not-allowed opacity-50",
              )}
            >
              <input
                type="radio"
                name="payment"
                disabled={!codAvailable}
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
                className="mt-1 size-4 accent-amz-orange"
              />
              <div className="text-sm">
                <p className="flex items-center gap-2 font-semibold text-zinc-900">
                  <Banknote className="size-4" /> Kapıda ödeme
                </p>
                <p className="text-zinc-600">
                  {codAvailable
                    ? "Siparişinizi teslim alırken ödeyin."
                    : "Kapıda ödeme şu anda kapalı."}
                </p>
              </div>
            </label>

            {!stripeAvailable && !codAvailable && (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                Şu anda hiçbir ödeme yöntemi açık değil. Lütfen daha sonra tekrar deneyin.
              </p>
            )}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Sipariş notu (isteğe bağlı)"
            rows={2}
            maxLength={500}
            className="input-amz mt-3 resize-y"
          />
        </section>

        {/* 3. Ürünler */}
        <section className="rounded-lg bg-white p-4 sm:p-5">
          <h2 className="mb-3 text-lg font-bold text-zinc-900">3. Siparişinizi gözden geçirin</h2>
          <ul className="divide-y divide-amz-border">
            {items.map((item) => (
              <li key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-3 py-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded bg-white">
                  <SafeImage
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="64px"
                    className="object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="line-clamp-2 text-zinc-900">{item.title}</p>
                  <p className="text-zinc-500">
                    {item.qty} adet
                    {item.color ? ` · ${item.color}` : ""}
                    {item.size ? ` · ${item.size}` : ""}
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-zinc-900">
                  {formatPrice(finalPrice(item.price, item.discountPercent) * item.qty)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Özet */}
      <aside className="w-full shrink-0 lg:sticky lg:top-32 lg:w-80">
        <div className="space-y-3 rounded-lg bg-white p-4">
          {belowMinimum && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Minimum sipariş tutarı {formatPrice(config.minOrderAmount)}.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || belowMinimum || (!stripeAvailable && !codAvailable)}
            className="btn-amz w-full"
          >
            {submitting && <Spinner />}
            {paymentMethod === "stripe" ? "Ödemeye geç" : "Siparişi onayla"}
          </button>

          <div className="flex gap-2">
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="Kupon kodu"
              className="input-amz"
            />
            <button type="button" onClick={applyCoupon} className="btn-amz-outline shrink-0">
              <Tag className="size-4" /> Uygula
            </button>
          </div>

          {coupon && (
            <p className="text-sm text-amz-success">
              {coupon.code} kuponu uygulandı (−{formatPrice(coupon.discount)})
            </p>
          )}

          <dl className="space-y-1.5 border-t border-amz-border pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-600">Ürünler</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-600">Kargo</dt>
              <dd>{shipping === 0 ? "Ücretsiz" : formatPrice(shipping)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-amz-success">
                <dt>İndirim</dt>
                <dd>−{formatPrice(discount)}</dd>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between">
                <dt className="text-zinc-600">KDV (%{config.taxRate})</dt>
                <dd>{formatPrice(tax)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-amz-border pt-2 text-lg font-bold text-amz-price">
              <dt>Toplam</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
        </div>
      </aside>
    </form>
  );
}
