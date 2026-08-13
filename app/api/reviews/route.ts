import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { reviewSchema } from "@/lib/validators";
import { refreshProductRating } from "@/lib/reviews";
import { getSettings } from "@/lib/settings";
import { fail, handleError, ok } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get("productId");
    if (!productId) return fail("Ürün kimliği gerekli", 400);

    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, image: true } } },
    });
    return ok({ reviews });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const settings = await getSettings();
    if (!settings.reviewsEnabled) {
      return fail("Yorumlar şu anda kapalı", 403);
    }
    const data = reviewSchema.parse(await request.json());

    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      select: { id: true },
    });
    if (!product) return fail("Ürün bulunamadı", 404);

    const review = await prisma.review.upsert({
      where: { userId_productId: { userId: user.id, productId: data.productId } },
      create: {
        userId: user.id,
        productId: data.productId,
        rating: data.rating,
        title: data.title || null,
        comment: data.comment,
      },
      update: {
        rating: data.rating,
        title: data.title || null,
        comment: data.comment,
      },
      include: { user: { select: { id: true, name: true, image: true } } },
    });

    await refreshProductRating(data.productId);
    return ok({ review }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser();
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return fail("Yorum kimliği gerekli", 400);

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return fail("Yorum bulunamadı", 404);
    if (review.userId !== user.id && user.role !== "ADMIN") {
      return fail("Bu yorumu silemezsiniz", 403);
    }

    await prisma.review.delete({ where: { id } });
    await refreshProductRating(review.productId);
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
