import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { cartSyncSchema } from "@/lib/validators";
import { hydrateCart, cartSubtotal } from "@/lib/cart";
import { handleError, ok } from "@/lib/api";

/** Kullanıcının veritabanındaki sepetini döner (güncel fiyat/stok ile). */
export async function GET() {
  try {
    const user = await requireUser();
    const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    const items = await hydrateCart(cart?.items ?? []);
    return ok({ items, subtotal: cartSubtotal(items) });
  } catch (error) {
    return handleError(error);
  }
}

/** Sepetin tamamını değiştirir (istemci tarafı sepet senkronizasyonu). */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser();
    const { items } = cartSyncSchema.parse(await request.json());
    const hydrated = await hydrateCart(items);

    await prisma.cart.upsert({
      where: { userId: user.id },
      create: { userId: user.id, items: hydrated },
      update: { items: hydrated },
    });

    return ok({ items: hydrated, subtotal: cartSubtotal(hydrated) });
  } catch (error) {
    return handleError(error);
  }
}

/** Sepeti tamamen boşaltır. */
export async function DELETE() {
  try {
    const user = await requireUser();
    await prisma.cart.upsert({
      where: { userId: user.id },
      create: { userId: user.id, items: [] },
      update: { items: [] },
    });
    return ok({ items: [], subtotal: 0 });
  } catch (error) {
    return handleError(error);
  }
}
