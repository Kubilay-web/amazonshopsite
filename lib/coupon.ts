import "server-only";
import prisma from "@/lib/prisma";
import { round2 } from "@/lib/utils";

export type CouponResult =
  | { valid: true; code: string; discountPercent: number; discount: number }
  | { valid: false; message: string };

/** Kupon kodunu doğrular ve sepet tutarına göre indirim miktarını hesaplar. */
export async function validateCoupon(code: string, subtotal: number): Promise<CouponResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { valid: false, message: "Kupon kodu boş" };

  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });
  if (!coupon) return { valid: false, message: "Kupon bulunamadı" };
  if (!coupon.active) return { valid: false, message: "Kupon aktif değil" };

  const now = new Date();
  if (coupon.startDate > now) return { valid: false, message: "Kupon henüz başlamadı" };
  if (coupon.endDate < now) return { valid: false, message: "Kuponun süresi dolmuş" };
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, message: "Kupon kullanım limitine ulaştı" };
  }
  if (subtotal < coupon.minAmount) {
    return {
      valid: false,
      message: `Bu kupon için minimum sepet tutarı ${coupon.minAmount} €`,
    };
  }

  return {
    valid: true,
    code: coupon.code,
    discountPercent: coupon.discountPercent,
    discount: round2((subtotal * coupon.discountPercent) / 100),
  };
}
