import "server-only";
import prisma from "@/lib/prisma";
import { round2 } from "@/lib/utils";

/** Ürünün ortalama puanını ve yorum sayısını yeniden hesaplar. */
export async function refreshProductRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.product
    .update({
      where: { id: productId },
      data: { rating: round2(agg._avg.rating ?? 0), numReviews: agg._count._all },
    })
    .catch(() => null);
}
