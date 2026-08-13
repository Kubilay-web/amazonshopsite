import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { inventoryUpdateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { handleError, ok } from "@/lib/api";

/** Stok ekranındaki satır içi düzenlemeleri tek istekte kaydeder. */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { updates } = inventoryUpdateSchema.parse(await request.json());

    const results = await Promise.all(
      updates.map((update) =>
        prisma.product
          .update({
            where: { id: update.id },
            data: {
              ...(update.stock !== undefined ? { stock: update.stock } : {}),
              ...(update.price !== undefined ? { price: update.price } : {}),
              ...(update.discountPercent !== undefined
                ? { discountPercent: update.discountPercent }
                : {}),
            },
            select: { id: true, stock: true, price: true, discountPercent: true },
          })
          .catch(() => null),
      ),
    );

    const saved = results.filter((r): r is NonNullable<typeof r> => r !== null);

    await logAudit({
      user: admin,
      action: "UPDATE",
      entity: "inventory",
      summary: `${saved.length} üründe stok/fiyat güncellendi`,
    });

    return ok({ count: saved.length, products: saved });
  } catch (error) {
    return handleError(error);
  }
}
