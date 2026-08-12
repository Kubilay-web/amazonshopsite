import "server-only";
import prisma from "@/lib/prisma";
import { finalPrice, round2 } from "@/lib/utils";

export type RawCartItem = {
  productId: string;
  qty: number;
  size?: string | null;
  color?: string | null;
};

export type HydratedCartItem = {
  productId: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  discountPercent: number;
  qty: number;
  size: string | null;
  color: string | null;
  stock: number;
};

/**
 * İstemciden gelen sepeti veritabanındaki güncel fiyat/stok ile doldurur.
 * Fiyat asla istemciden alınmaz — her zaman DB'den okunur.
 */
export async function hydrateCart(items: RawCartItem[]): Promise<HydratedCartItem[]> {
  const unique = new Map<string, RawCartItem>();
  for (const item of items) {
    if (!item?.productId || !Number.isFinite(item.qty) || item.qty < 1) continue;
    const key = `${item.productId}|${item.size ?? ""}|${item.color ?? ""}`;
    const prev = unique.get(key);
    unique.set(key, {
      ...item,
      qty: Math.min(99, (prev?.qty ?? 0) + Math.floor(item.qty)),
    });
  }
  if (unique.size === 0) return [];

  const ids = [...new Set([...unique.values()].map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    select: {
      id: true,
      title: true,
      slug: true,
      images: true,
      price: true,
      discountPercent: true,
      stock: true,
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const result: HydratedCartItem[] = [];
  for (const item of unique.values()) {
    const p = byId.get(item.productId);
    if (!p) continue; // silinmiş / pasif ürün sepetten düşer
    result.push({
      productId: p.id,
      slug: p.slug,
      title: p.title,
      image: p.images[0] ?? "",
      price: p.price,
      discountPercent: p.discountPercent,
      qty: Math.max(1, Math.min(item.qty, Math.max(p.stock, 1))),
      size: item.size || null,
      color: item.color || null,
      stock: p.stock,
    });
  }
  return result;
}

export function cartSubtotal(items: HydratedCartItem[]) {
  return round2(
    items.reduce((sum, i) => sum + finalPrice(i.price, i.discountPercent) * i.qty, 0),
  );
}
