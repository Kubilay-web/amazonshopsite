import prisma from "@/lib/prisma";
import { currentTimestamp } from "@/lib/utils";
import { CouponManager } from "@/components/admin/coupon-manager";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Kuponlar</h1>
        <p className="text-sm text-zinc-600">{coupons.length} kupon</p>
      </div>

      <CouponManager
        now={currentTimestamp()}
        coupons={coupons.map((c) => ({
          id: c.id,
          code: c.code,
          discountPercent: c.discountPercent,
          minAmount: c.minAmount,
          maxUses: c.maxUses,
          usedCount: c.usedCount,
          startDate: c.startDate.toISOString(),
          endDate: c.endDate.toISOString(),
          active: c.active,
        }))}
      />
    </div>
  );
}
