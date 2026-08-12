import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { couponSchema } from "@/lib/validators";
import { fail, handleError, ok } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return ok({ coupons });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const data = couponSchema.parse(await request.json());

    const exists = await prisma.coupon.findUnique({ where: { code: data.code } });
    if (exists) return fail("Bu kupon kodu zaten var", 409, { code: "Kod kullanımda" });

    const coupon = await prisma.coupon.create({
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
    return ok({ coupon }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
