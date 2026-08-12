import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { couponSchema } from "@/lib/validators";
import { fail, handleError, ok } from "@/lib/api";
import { isValidObjectId } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Geçersiz kimlik", 400);

    const data = couponSchema.parse(await request.json());
    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code: data.code,
        discountPercent: data.discountPercent,
        minAmount: data.minAmount,
        maxUses: data.maxUses,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        active: data.active,
      },
    });
    return ok({ coupon });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.coupon.delete({ where: { id } });
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
