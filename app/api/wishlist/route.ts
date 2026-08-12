import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getWishlist } from "@/lib/queries";
import { fail, handleError, ok } from "@/lib/api";
import { isValidObjectId } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await getWishlist(user.id);
    return ok({ items });
  } catch (error) {
    return handleError(error);
  }
}

/** Favoriye ekler / çıkarır (toggle). */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const { productId } = (await request.json()) as { productId?: string };
    if (!productId || !isValidObjectId(productId)) return fail("Geçersiz ürün", 400);

    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });

    if (existing) {
      await prisma.wishlist.delete({ where: { id: existing.id } });
      return ok({ added: false });
    }

    await prisma.wishlist.create({ data: { userId: user.id, productId } });
    return ok({ added: true }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser();
    const productId = request.nextUrl.searchParams.get("productId");
    if (!productId) return fail("Ürün kimliği gerekli", 400);

    await prisma.wishlist.deleteMany({ where: { userId: user.id, productId } });
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
