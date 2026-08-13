import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { orderStatusSchema } from "@/lib/validators";
import { restoreStock } from "@/lib/orders";
import { logAudit } from "@/lib/audit";
import { fail, handleError, ok } from "@/lib/api";
import { isValidObjectId, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Geçersiz kimlik", 400);

    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!order) return fail("Sipariş bulunamadı", 404);
    if (order.userId !== user.id && user.role !== "ADMIN") {
      return fail("Bu siparişi görüntüleyemezsiniz", 403);
    }

    return ok({ order });
  } catch (error) {
    return handleError(error);
  }
}

/** Yönetici sipariş durumunu günceller. */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (user.role !== "ADMIN") return fail("Bu işlem için yetkiniz yok", 403);

    const data = orderStatusSchema.parse(await request.json());
    const current = await prisma.order.findUnique({ where: { id } });
    if (!current) return fail("Sipariş bulunamadı", 404);

    // İptale geçişte stoklar iade edilir
    if (data.status === "CANCELLED" && current.status !== "CANCELLED") {
      await restoreStock(id);
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.paymentStatus
          ? {
              paymentStatus: data.paymentStatus,
              isPaid: data.paymentStatus === "PAID",
              paidAt: data.paymentStatus === "PAID" ? current.paidAt ?? new Date() : current.paidAt,
            }
          : {}),
        ...(data.status === "DELIVERED"
          ? { isDelivered: true, deliveredAt: new Date() }
          : {}),
        ...(data.trackingNumber !== undefined
          ? { trackingNumber: data.trackingNumber || null }
          : {}),
      },
    });

    const changes = [
      data.status ? `durum → ${ORDER_STATUS_LABELS[data.status]}` : null,
      data.paymentStatus ? `ödeme → ${PAYMENT_STATUS_LABELS[data.paymentStatus]}` : null,
      data.trackingNumber ? `takip no → ${data.trackingNumber}` : null,
    ].filter(Boolean);

    await logAudit({
      user,
      action: "UPDATE",
      entity: "order",
      entityId: id,
      summary: `${order.orderNumber}: ${changes.join(", ") || "güncellendi"}`,
    });

    return ok({ order });
  } catch (error) {
    return handleError(error);
  }
}

/** Kullanıcı henüz kargolanmamış siparişini iptal edebilir. */
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return fail("Sipariş bulunamadı", 404);
    if (order.userId !== user.id && user.role !== "ADMIN") return fail("Yetkiniz yok", 403);
    if (["SHIPPED", "DELIVERED", "CANCELLED"].includes(order.status)) {
      return fail("Bu sipariş artık iptal edilemez", 409);
    }

    if (order.isPaid || order.paymentMethod === "cod") await restoreStock(id);

    const updated = await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    await logAudit({
      user,
      action: "UPDATE",
      entity: "order",
      entityId: id,
      summary: `${updated.orderNumber} iptal edildi`,
    });

    return ok({ order: updated });
  } catch (error) {
    return handleError(error);
  }
}
