import "server-only";
import prisma from "@/lib/prisma";

/**
 * Siparişi ödendi olarak işaretler, stokları düşer, sepeti boşaltır ve
 * kupon sayacını artırır. Idempotent: aynı sipariş iki kez işlenmez.
 */
export async function markOrderPaid(orderId: string, paymentIntentId?: string | null) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;
  if (order.isPaid) return order;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      isPaid: true,
      paidAt: new Date(),
      paymentStatus: "PAID",
      status: order.status === "PENDING" ? "PROCESSING" : order.status,
      paymentIntentId: paymentIntentId ?? order.paymentIntentId,
    },
  });

  await applyStockChanges(orderId);
  await prisma.cart.updateMany({ where: { userId: order.userId }, data: { items: [] } });

  if (order.couponCode) {
    await prisma.coupon.updateMany({
      where: { code: order.couponCode },
      data: { usedCount: { increment: 1 } },
    });
  }

  return updated;
}

/** Sipariş kalemleri için stok düşer / satış sayacını artırır. */
export async function applyStockChanges(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { items: true },
  });
  if (!order) return;

  await Promise.all(
    order.items.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.qty }, sold: { increment: item.qty } },
      }).catch(() => null),
    ),
  );
}

/** Sipariş iptalinde stokları geri yükler. */
export async function restoreStock(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { items: true },
  });
  if (!order) return;

  await Promise.all(
    order.items.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.qty }, sold: { decrement: item.qty } },
      }).catch(() => null),
    ),
  );
}
