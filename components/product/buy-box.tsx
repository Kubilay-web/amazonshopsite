"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, ShieldCheck, ShoppingCart, Truck, Zap } from "lucide-react";
import { Price } from "@/components/ui/price";
import { Spinner } from "@/components/ui/spinner";
import { useCart } from "@/components/providers/cart-provider";
import { useWishlist } from "@/components/providers/wishlist-provider";
import { useToast } from "@/components/providers/toast-provider";
import { useShopConfig } from "@/components/providers/shop-config-provider";
import { cn, finalPrice, formatPrice } from "@/lib/utils";

type Color = { name: string; hex: string };

export function BuyBox({
  product,
}: {
  product: {
    id: string;
    slug: string;
    title: string;
    images: string[];
    price: number;
    discountPercent: number;
    stock: number;
    sizes: string[];
    colors: Color[];
    shippingFree: boolean;
  };
}) {
  const router = useRouter();
  const { add } = useCart();
  const wishlist = useWishlist();
  const { toast } = useToast();
  const config = useShopConfig();

  const [qty, setQty] = useState(1);
  const [size, setSize] = useState<string | null>(product.sizes[0] ?? null);
  const [color, setColor] = useState<string | null>(product.colors[0]?.name ?? null);
  const [busy, setBusy] = useState<"add" | "buy" | null>(null);

  const outOfStock = product.stock <= 0;
  const unit = finalPrice(product.price, product.discountPercent);
  const freeShipping = product.shippingFree || unit * qty >= config.freeShippingLimit;

  async function addToCart() {
    await add({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      image: product.images[0] ?? "",
      price: product.price,
      discountPercent: product.discountPercent,
      size,
      color,
      stock: product.stock,
      qty,
    });
  }

  async function handleAdd() {
    if (outOfStock) return;
    setBusy("add");
    try {
      await addToCart();
      toast("Ürün sepete eklendi");
    } finally {
      setBusy(null);
    }
  }

  async function handleBuyNow() {
    if (outOfStock) return;
    setBusy("buy");
    try {
      await addToCart();
      router.push("/checkout");
    } finally {
      setBusy(null);
    }
  }

  async function handleWishlist() {
    const result = await wishlist.toggle(product.id);
    if (result === null) {
      toast("Favorilere eklemek için giriş yapın", "info");
      return;
    }
    toast(result ? "Favorilere eklendi" : "Favorilerden çıkarıldı");
  }

  const maxQty = Math.min(10, Math.max(1, product.stock));

  return (
    <div className="space-y-4">
      {/* Varyant seçimleri */}
      {product.colors.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-zinc-800">
            Renk: <span className="font-normal text-zinc-600">{color}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setColor(c.name)}
                title={c.name}
                aria-label={c.name}
                className={cn(
                  "size-8 rounded-full border-2 transition",
                  color === c.name
                    ? "border-amz-orange ring-2 ring-amz-orange/30"
                    : "border-amz-border",
                )}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      )}

      {product.sizes.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-zinc-800">
            Beden: <span className="font-normal text-zinc-600">{size}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={cn(
                  "min-w-11 rounded-md border px-3 py-1.5 text-sm transition",
                  size === s
                    ? "border-amz-orange bg-amz-orange/10 font-semibold"
                    : "border-amz-border bg-white hover:bg-amz-light",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Satın alma kutusu */}
      <div className="card-amz space-y-3 p-4">
        <Price price={product.price} discountPercent={product.discountPercent} size="lg" />

        {freeShipping ? (
          <p className="flex items-center gap-1.5 text-sm text-amz-success">
            <Truck className="size-4" /> Ücretsiz kargo
          </p>
        ) : (
          <p className="text-sm text-zinc-600">
            {formatPrice(config.freeShippingLimit)} ve üzeri siparişlerde kargo bedava
          </p>
        )}

        <p className={cn("text-lg font-medium", outOfStock ? "text-amz-price" : "text-amz-success")}>
          {outOfStock ? "Stokta yok" : "Stokta var"}
        </p>

        {!outOfStock && product.stock <= 10 && (
          <p className="text-sm text-amz-price">Son {product.stock} ürün!</p>
        )}

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          Adet:
          <select
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            disabled={outOfStock}
            className="rounded border border-amz-border bg-amz-light px-2 py-1.5 outline-none"
          >
            {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock || busy !== null}
          className="btn-amz w-full"
        >
          {busy === "add" ? <Spinner /> : <ShoppingCart className="size-4" />}
          Sepete ekle
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={outOfStock || busy !== null}
          className="w-full rounded-full border border-amz-orange bg-amz-orange px-4 py-2 text-sm font-medium text-zinc-900 transition hover:brightness-95 disabled:opacity-60"
        >
          {busy === "buy" ? (
            <Spinner className="mx-auto" />
          ) : (
            <span className="inline-flex items-center gap-2">
              <Zap className="size-4" /> Hemen al
            </span>
          )}
        </button>

        <button type="button" onClick={handleWishlist} className="btn-amz-outline w-full">
          <Heart
            className={cn(
              "size-4",
              wishlist.has(product.id) && "fill-amz-price text-amz-price",
            )}
          />
          {wishlist.has(product.id) ? "Favorilerimde" : "Favorilere ekle"}
        </button>

        <p className="flex items-start gap-1.5 border-t border-amz-border pt-3 text-xs text-zinc-600">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amz-success" />
          Güvenli ödeme · 14 gün içinde koşulsuz iade
        </p>
      </div>
    </div>
  );
}
