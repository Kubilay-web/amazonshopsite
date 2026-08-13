import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validators";
import { hydrateCart, cartSubtotal } from "@/lib/cart";
import { validateCoupon } from "@/lib/coupon";
import { getStripe, stripeConfigured, appUrl } from "@/lib/stripe";
import { applyStockChanges } from "@/lib/orders";
import { getSettings, shippingFor, taxFor } from "@/lib/settings";
import { fail, handleError, ok } from "@/lib/api";
import { finalPrice, formatPrice, generateOrderNumber, round2 } from "@/lib/utils";

/**
 * Sipariş oluşturur. Fiyatlar ve stok her zaman veritabanından okunur;
 * istemciden gelen tutarlara güvenilmez.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const data = checkoutSchema.parse(await request.json());
    const settings = await getSettings();

    // 0) Yönetim panelinden kapatılmış ödeme yöntemleri reddedilir
    if (data.paymentMethod === "cod" && !settings.codEnabled) {
      return fail("Kapıda ödeme şu anda kapalı", 403);
    }
    if (data.paymentMethod === "stripe" && !settings.stripeEnabled) {
      return fail("Kart ile ödeme şu anda kapalı", 403);
    }

    // 1) Teslimat adresi
    let shipping = data.shippingAddress ?? null;
    if (data.addressId) {
      const addr = await prisma.address.findFirst({
        where: { id: data.addressId, userId: user.id },
      });
      if (!addr) return fail("Adres bulunamadı", 404);
      shipping = {
        fullName: addr.fullName,
        phone: addr.phone,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2 ?? "",
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
      };
    }
    if (!shipping) return fail("Teslimat adresi gerekli", 400);

    // 2) Sepet (DB'den, güncel fiyat + stok ile)
    const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    const items = await hydrateCart(cart?.items ?? []);
    if (items.length === 0) return fail("Sepetiniz boş", 400);

    const outOfStock = items.filter((i) => i.stock < i.qty);
    if (outOfStock.length > 0) {
      return fail(
        `Yetersiz stok: ${outOfStock.map((i) => i.title).join(", ")}`,
        409,
      );
    }

    // 3) Tutarlar — kargo ve eşikler site ayarlarından okunur
    const itemsPrice = cartSubtotal(items);
    if (settings.minOrderAmount > 0 && itemsPrice < settings.minOrderAmount) {
      return fail(`Minimum sipariş tutarı ${formatPrice(settings.minOrderAmount)}`, 400);
    }
    const shippingPrice = shippingFor(settings, itemsPrice);

    let discount = 0;
    let couponCode: string | null = null;
    if (data.couponCode) {
      const result = await validateCoupon(data.couponCode, itemsPrice);
      if (!result.valid) return fail(result.message, 400);
      discount = result.discount;
      couponCode = result.code;
    }

    // KDV, indirim düşüldükten sonraki tutar üzerinden hesaplanır (oran 0 ise fiyata dahil)
    const taxable = round2(Math.max(0, itemsPrice - discount));
    const taxPrice = taxFor(settings, taxable);
    const totalPrice = round2(taxable + shippingPrice + taxPrice);

    // 4) Sipariş kaydı
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: user.id,
        items: items.map((i) => ({
          productId: i.productId,
          slug: i.slug,
          title: i.title,
          image: i.image,
          price: finalPrice(i.price, i.discountPercent),
          qty: i.qty,
          size: i.size,
          color: i.color,
        })),
        shippingAddress: {
          fullName: shipping.fullName,
          phone: shipping.phone,
          addressLine1: shipping.addressLine1,
          addressLine2: shipping.addressLine2 || null,
          city: shipping.city,
          state: shipping.state,
          postalCode: shipping.postalCode,
          country: shipping.country,
        },
        paymentMethod: data.paymentMethod,
        itemsPrice,
        shippingPrice,
        taxPrice,
        discount,
        totalPrice,
        couponCode,
        note: data.note || null,
      },
    });

    // 5a) Kapıda ödeme: sipariş hemen onaylanır, stok düşülür
    if (data.paymentMethod === "cod") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PROCESSING" },
      });
      await applyStockChanges(order.id);
      await prisma.cart.updateMany({ where: { userId: user.id }, data: { items: [] } });
      if (couponCode) {
        await prisma.coupon.updateMany({
          where: { code: couponCode },
          data: { usedCount: { increment: 1 } },
        });
      }
      return ok({ orderId: order.id, redirect: `/account/orders/${order.id}?placed=1` }, { status: 201 });
    }

    // 5b) Stripe Checkout
    const stripe = getStripe();
    if (!stripe || !stripeConfigured) {
      await prisma.order.delete({ where: { id: order.id } });
      return fail(
        "Stripe yapılandırılmamış. .env dosyasına STRIPE_SECRET_KEY ekleyin veya kapıda ödeme seçin.",
        503,
      );
    }

    const lineItems = items.map((i) => ({
      quantity: i.qty,
      price_data: {
        currency: "eur",
        unit_amount: Math.round(finalPrice(i.price, i.discountPercent) * 100),
        product_data: {
          name: i.title.slice(0, 120),
          images: i.image?.startsWith("http") ? [i.image] : undefined,
        },
      },
    }));

    if (shippingPrice > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(shippingPrice * 100),
          product_data: { name: "Kargo Ücreti", images: undefined },
        },
      });
    }

    if (taxPrice > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(taxPrice * 100),
          product_data: { name: `KDV (%${settings.taxRate})`, images: undefined },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: user.email,
      client_reference_id: order.id,
      metadata: { orderId: order.id, userId: user.id },
      ...(discount > 0
        ? {
            discounts: [
              {
                coupon: (
                  await stripe.coupons.create({
                    amount_off: Math.round(discount * 100),
                    currency: "eur",
                    duration: "once",
                    name: `Kupon ${couponCode}`,
                  })
                ).id,
              },
            ],
          }
        : {}),
      success_url: `${appUrl()}/account/orders/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl()}/checkout?canceled=1`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return ok({ orderId: order.id, url: session.url }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
