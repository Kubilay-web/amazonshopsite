import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { orderBulkSchema } from "@/lib/validators";
import { restoreStock } from "@/lib/orders";
import { logAudit } from "@/lib/audit";
import { fail, handleError, ok } from "@/lib/api";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/utils";

/** Sipariş listesinde seçilen kayıtların durumunu topluca değiştirir. */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = orderBulkSchema.parse(await request.json());
    if (!body.status && !body.paymentStatus) return fail("Bir durum seçin", 400);

    const orders = await prisma.order.findMany({
      where: { id: { in: body.ids } },
      select: { id: true, status: true, paidAt: true },
    });

    // İptale geçen siparişlerde stoklar tek tek iade edilir
    if (body.status === "CANCELLED") {
      for (const order of orders) {
        if (order.status !== "CANCELLED") await restoreStock(order.id);
      }
    }

    const now = new Date();
    let count = 0;
    for (const order of orders) {
      await prisma.order
        .update({
          where: { id: order.id },
          data: {
            ...(body.status ? { status: body.status } : {}),
            ...(body.status === "DELIVERED" ? { isDelivered: true, deliveredAt: now } : {}),
            ...(body.paymentStatus
              ? {
                  paymentStatus: body.paymentStatus,
                  isPaid: body.paymentStatus === "PAID",
                  paidAt: body.paymentStatus === "PAID" ? (order.paidAt ?? now) : order.paidAt,
                }
              : {}),
          },
        })
        .then(() => {
          count += 1;
        })
        .catch(() => null);
    }

    const parts = [
      body.status ? `durum: ${ORDER_STATUS_LABELS[body.status]}` : null,
      body.paymentStatus ? `ödeme: ${PAYMENT_STATUS_LABELS[body.paymentStatus]}` : null,
    ].filter(Boolean);

    await logAudit({
      user: admin,
      action: "BULK",
      entity: "order",
      summary: `${count} sipariş güncellendi (${parts.join(", ")})`,
    });

    return ok({ count });
  } catch (error) {
    return handleError(error);
  }
}
