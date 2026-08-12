import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { markOrderPaid } from "@/lib/orders";
import { fail, handleError, ok } from "@/lib/api";

/**
 * Stripe'tan dönüşte siparişi doğrular. Webhook yapılandırılmamış olsa bile
 * ödeme durumunun güncellenmesini sağlayan yedek yol.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const { orderId, sessionId } = (await request.json()) as {
      orderId?: string;
      sessionId?: string;
    };
    if (!orderId || !sessionId) return fail("orderId ve sessionId gerekli", 400);

    const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id } });
    if (!order) return fail("Sipariş bulunamadı", 404);
    if (order.isPaid) return ok({ paid: true });

    const stripe = getStripe();
    if (!stripe) return fail("Stripe yapılandırılmamış", 503);

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.orderId !== orderId && session.client_reference_id !== orderId) {
      return fail("Oturum bu siparişe ait değil", 400);
    }

    if (session.payment_status === "paid") {
      await markOrderPaid(orderId, (session.payment_intent as string) ?? null);
      return ok({ paid: true });
    }

    return ok({ paid: false, status: session.payment_status });
  } catch (error) {
    return handleError(error);
  }
}
