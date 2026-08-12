import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { isValidObjectId } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

/** Yönetici: rol değiştirme / hesabı askıya alma. */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Geçersiz kimlik", 400);
    if (id === admin.id) return fail("Kendi hesabınızı değiştiremezsiniz", 400);

    const body = (await request.json()) as { role?: "USER" | "ADMIN"; blocked?: boolean };

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(body.role ? { role: body.role } : {}),
        ...(typeof body.blocked === "boolean" ? { blocked: body.blocked } : {}),
      },
      select: { id: true, name: true, email: true, role: true, blocked: true },
    });

    return ok({ user });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    if (id === admin.id) return fail("Kendi hesabınızı silemezsiniz", 400);

    await prisma.$transaction([
      prisma.review.deleteMany({ where: { userId: id } }),
      prisma.wishlist.deleteMany({ where: { userId: id } }),
      prisma.address.deleteMany({ where: { userId: id } }),
      prisma.cart.deleteMany({ where: { userId: id } }),
      prisma.order.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
