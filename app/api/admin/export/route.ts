import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { fail, handleError } from "@/lib/api";
import { finalPrice } from "@/lib/utils";

type Row = (string | number | null | undefined)[];

/** Excel'in ayraç ve tırnak kurallarına uygun CSV üretir. */
function toCsv(headers: string[], rows: Row[]) {
  const escape = (value: string | number | null | undefined) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [headers.map(escape).join(";"), ...rows.map((r) => r.map(escape).join(";"))];
  // BOM: Excel'in UTF-8 Türkçe karakterleri doğru okuması için
  return `﻿${lines.join("\r\n")}`;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

const TYPES = ["orders", "products", "users", "reviews", "coupons"] as const;
type ExportType = (typeof TYPES)[number];

/** Yönetim panelindeki listeleri CSV olarak indirir. */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const type = request.nextUrl.searchParams.get("type") as ExportType | null;
    if (!type || !TYPES.includes(type)) return fail("Geçersiz dışa aktarım türü", 400);

    let csv = "";

    if (type === "orders") {
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5000,
        include: { user: { select: { name: true, email: true } } },
      });
      csv = toCsv(
        [
          "Sipariş No",
          "Tarih",
          "Müşteri",
          "E-posta",
          "Ürün adedi",
          "Ara toplam",
          "Kargo",
          "İndirim",
          "Toplam",
          "Kupon",
          "Ödeme yöntemi",
          "Ödeme durumu",
          "Sipariş durumu",
          "Kargo takip",
          "Şehir",
          "Ülke",
        ],
        orders.map((o) => [
          o.orderNumber,
          isoDate(o.createdAt),
          o.user.name,
          o.user.email,
          o.items.reduce((s, i) => s + i.qty, 0),
          o.itemsPrice,
          o.shippingPrice,
          o.discount,
          o.totalPrice,
          o.couponCode ?? "",
          o.paymentMethod,
          o.paymentStatus,
          o.status,
          o.trackingNumber ?? "",
          o.shippingAddress.city,
          o.shippingAddress.country,
        ]),
      );
    }

    if (type === "products") {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        take: 5000,
        include: {
          category: { select: { name: true } },
          subCategory: { select: { name: true } },
        },
      });
      csv = toCsv(
        [
          "Başlık",
          "Slug",
          "SKU",
          "Marka",
          "Kategori",
          "Alt kategori",
          "Fiyat",
          "İndirim %",
          "Net fiyat",
          "Stok",
          "Satış",
          "Puan",
          "Yorum",
          "Yayında",
          "Öne çıkan",
          "Oluşturma",
        ],
        products.map((p) => [
          p.title,
          p.slug,
          p.sku ?? "",
          p.brand ?? "",
          p.category.name,
          p.subCategory?.name ?? "",
          p.price,
          p.discountPercent,
          finalPrice(p.price, p.discountPercent),
          p.stock,
          p.sold,
          p.rating,
          p.numReviews,
          p.isActive ? "Evet" : "Hayır",
          p.featured ? "Evet" : "Hayır",
          isoDate(p.createdAt),
        ]),
      );
    }

    if (type === "users") {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5000,
        select: {
          name: true,
          email: true,
          phone: true,
          role: true,
          blocked: true,
          createdAt: true,
          _count: { select: { orders: true, reviews: true } },
        },
      });
      csv = toCsv(
        ["Ad", "E-posta", "Telefon", "Rol", "Askıda", "Sipariş", "Yorum", "Kayıt"],
        users.map((u) => [
          u.name,
          u.email,
          u.phone ?? "",
          u.role,
          u.blocked ? "Evet" : "Hayır",
          u._count.orders,
          u._count.reviews,
          isoDate(u.createdAt),
        ]),
      );
    }

    if (type === "reviews") {
      const reviews = await prisma.review.findMany({
        orderBy: { createdAt: "desc" },
        take: 5000,
        include: {
          user: { select: { name: true, email: true } },
          product: { select: { title: true } },
        },
      });
      csv = toCsv(
        ["Ürün", "Kullanıcı", "E-posta", "Puan", "Başlık", "Yorum", "Tarih"],
        reviews.map((r) => [
          r.product.title,
          r.user.name,
          r.user.email,
          r.rating,
          r.title ?? "",
          r.comment,
          isoDate(r.createdAt),
        ]),
      );
    }

    if (type === "coupons") {
      const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
      csv = toCsv(
        ["Kod", "İndirim %", "Min. tutar", "Kullanım", "Maks.", "Başlangıç", "Bitiş", "Aktif"],
        coupons.map((c) => [
          c.code,
          c.discountPercent,
          c.minAmount,
          c.usedCount,
          c.maxUses || "sınırsız",
          isoDate(c.startDate),
          isoDate(c.endDate),
          c.active ? "Evet" : "Hayır",
        ]),
      );
    }

    await logAudit({
      user: admin,
      action: "UPDATE",
      entity: "setting",
      summary: `CSV dışa aktarım: ${type}`,
    });

    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${type}-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
