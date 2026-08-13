import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { refreshProductRating } from "@/lib/reviews";
import { fail, handleError, ok } from "@/lib/api";
import { isValidObjectId } from "@/lib/utils";

/** Yönetici: tüm yorumlar + arama ve puan filtresi. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const sp = request.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const rating = Number(sp.get("rating") ?? 0);
    const page = Math.max(1, Number(sp.get("page") ?? 1));
    const perPage = Math.min(100, Number(sp.get("perPage") ?? 25));

    const where: Prisma.ReviewWhereInput = {
      ...(rating >= 1 && rating <= 5 ? { rating } : {}),
      ...(q
        ? {
            OR: [
              { comment: { contains: q, mode: "insensitive" } },
              { title: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, title: true, slug: true, images: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return ok({ reviews, total, page, pages: Math.max(1, Math.ceil(total / perPage)) });
  } catch (error) {
    return handleError(error);
  }
}

/** Yönetici: yorum siler ve ürün puanını tazeler. */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const id = request.nextUrl.searchParams.get("id");
    if (!id || !isValidObjectId(id)) return fail("Geçersiz yorum kimliği", 400);

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return fail("Yorum bulunamadı", 404);

    await prisma.review.delete({ where: { id } });
    await refreshProductRating(review.productId);

    await logAudit({
      user: admin,
      action: "DELETE",
      entity: "review",
      entityId: id,
      summary: `Yorum silindi (${review.rating}★)`,
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
