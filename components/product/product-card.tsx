"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Rating } from "@/components/ui/rating";
import { Price } from "@/components/ui/price";
import { Spinner } from "@/components/ui/spinner";
import { useCart } from "@/components/providers/cart-provider";
import { useWishlist } from "@/components/providers/wishlist-provider";
import { useToast } from "@/components/providers/toast-provider";
import { cn, truncate } from "@/lib/utils";
import type { ProductCardData } from "@/types";

export function ProductCard({
  product,
  className,
  compact = false,
}: {
  product: ProductCardData;
  className?: string;
  compact?: boolean;
}) {
  const { add } = useCart();
  const wishlist = useWishlist();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);

  const outOfStock = product.stock <= 0;
  const inWishlist = wishlist.has(product.id);

  async function handleAdd(event: React.MouseEvent) {
    event.preventDefault();
    if (outOfStock) return;
    setAdding(true);
    try {
      await add({
        productId: product.id,
        slug: product.slug,
        title: product.title,
        image: product.images[0] ?? "",
        price: product.price,
        discountPercent: product.discountPercent,
        size: null,
        color: null,
        stock: product.stock,
      });
      toast("Ürün sepete eklendi");
    } finally {
      setAdding(false);
    }
  }

  async function handleWishlist(event: React.MouseEvent) {
    event.preventDefault();
    const result = await wishlist.toggle(product.id);
    if (result === null) {
      toast("Favorilere eklemek için giriş yapın", "info");
      return;
    }
    toast(result ? "Favorilere eklendi" : "Favorilerden çıkarıldı");
  }

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-lg border border-amz-border bg-white transition hover:shadow-md",
        className,
      )}
    >
      <button
        type="button"
        onClick={handleWishlist}
        aria-label={inWishlist ? "Favorilerden çıkar" : "Favorilere ekle"}
        className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur transition hover:bg-white"
      >
        <Heart
          className={cn(
            "size-4",
            inWishlist ? "fill-amz-price text-amz-price" : "text-zinc-500",
          )}
        />
      </button>

      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square w-full overflow-hidden bg-white p-3">
          <SafeImage
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-contain transition duration-300 group-hover:scale-105"
          />
          {product.discountPercent > 0 && (
            <span className="absolute left-2 top-2 rounded bg-amz-price px-1.5 py-0.5 text-[11px] font-bold text-white">
              %{product.discountPercent} indirim
            </span>
          )}
          {outOfStock && (
            <span className="absolute inset-x-0 bottom-0 bg-zinc-900/75 py-1 text-center text-xs font-medium text-white">
              Tükendi
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3 pt-0">
        {product.brand && (
          <span className="text-[11px] uppercase tracking-wide text-zinc-500">
            {product.brand}
          </span>
        )}
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 text-sm leading-snug text-zinc-800 hover:text-amz-link-hover"
          title={product.title}
        >
          {compact ? truncate(product.title, 60) : product.title}
        </Link>

        <Rating value={product.rating} count={product.numReviews} />

        <Price price={product.price} discountPercent={product.discountPercent} size="sm" />

        {product.shippingFree && (
          <span className="text-xs font-medium text-amz-success">Ücretsiz kargo</span>
        )}

        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock || adding}
          className="btn-amz mt-auto w-full"
        >
          {adding ? <Spinner /> : <ShoppingCart className="size-4" />}
          {outOfStock ? "Stokta yok" : "Sepete ekle"}
        </button>
      </div>
    </div>
  );
}
