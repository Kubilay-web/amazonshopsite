import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { markOrderPaid } from "@/lib/orders";

export const runtime = "nodejs";

/** Stripe webhook. Gövde imzası doğrulandığı için ham metin okunur. */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    return NextResponse.json({ message: "Stripe webhook yapılandırılmamış" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ message: "İmza yok" }, { status: 400 });
  }

  let event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error("[stripe-webhook] imza doğrulanamadı", error);
    return NextResponse.json({ message: "İmza geçersiz" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId ?? session.client_reference_id;
        if (orderId && session.payment_status === "paid") {
          await markOrderPaid(orderId, (session.payment_intent as string) ?? null);
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId ?? session.client_reference_id;
        if (orderId) {
          await prisma.order.updateMany({
            where: { id: orderId, isPaid: false },
            data: { status: "CANCELLED", paymentStatus: "FAILED" },
          });
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        await prisma.order.updateMany({
          where: { paymentIntentId: intent.id, isPaid: false },
          data: { paymentStatus: "FAILED" },
        });
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object;
        if (charge.payment_intent) {
          await prisma.order.updateMany({
            where: { paymentIntentId: String(charge.payment_intent) },
            data: { paymentStatus: "REFUNDED" },
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("[stripe-webhook] işlenemedi", error);
    return NextResponse.json({ message: "İşlenemedi" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
