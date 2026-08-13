import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { couponSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { fail, handleError, ok } from "@/lib/api";
import { isValidObjectId } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const admin = await requireAdmin();
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
    await logAudit({
      user: admin,
      action: "UPDATE",
      entity: "coupon",
      entityId: coupon.id,
      summary: `Kupon güncellendi: ${coupon.code}`,
    });

    return ok({ coupon });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const coupon = await prisma.coupon.delete({ where: { id } });

    await logAudit({
      user: admin,
      action: "DELETE",
      entity: "coupon",
      entityId: id,
      summary: `Kupon silindi: ${coupon.code}`,
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
