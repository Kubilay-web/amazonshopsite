import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { validateCoupon } from "@/lib/coupon";
import { fail, handleError, ok } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    await requireUser();
    const { code, subtotal } = (await request.json()) as {
      code?: string;
      subtotal?: number;
    };
    if (!code) return fail("Kupon kodu gerekli", 400);

    const result = await validateCoupon(code, Number(subtotal ?? 0));
    if (!result.valid) return fail(result.message, 400);

    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
