import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { productBulkSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { fail, handleError, ok } from "@/lib/api";

const ACTION_LABELS: Record<string, string> = {
  activate: "yayına alındı",
  deactivate: "pasife alındı",
  feature: "öne çıkarıldı",
  unfeature: "öne çıkarma kaldırıldı",
  discount: "indirim uygulandı",
  stock: "stok güncellendi",
  category: "kategori değiştirildi",
  delete: "silindi",
};

/** Ürün listesinde seçilen kayıtlara toplu işlem uygular. */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = productBulkSchema.parse(await request.json());
    const where = { id: { in: body.ids } };

    if (body.action === "delete") {
      // Ürüne bağlı yorum ve favorileri de temizle
      await prisma.review.deleteMany({ where: { productId: { in: body.ids } } });
      await prisma.wishlist.deleteMany({ where: { productId: { in: body.ids } } });
      const result = await prisma.product.deleteMany({ where });
      await logAudit({
        user: admin,
        action: "BULK",
        entity: "product",
        summary: `${result.count} ürün silindi`,
      });
      return ok({ count: result.count });
    }

    let data: Prisma.ProductUpdateManyMutationInput;
    switch (body.action) {
      case "activate":
        data = { isActive: true };
        break;
      case "deactivate":
        data = { isActive: false };
        break;
      case "feature":
        data = { featured: true };
        break;
      case "unfeature":
        data = { featured: false };
        break;
      case "discount":
        if (body.discountPercent === undefined) return fail("İndirim oranı gerekli", 400);
        data = { discountPercent: body.discountPercent };
        break;
      case "stock":
        if (body.stock === undefined) return fail("Stok değeri gerekli", 400);
        data = { stock: body.stock };
        break;
      case "category": {
        if (!body.categoryId) return fail("Kategori seçin", 400);
        const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
        if (!category) return fail("Kategori bulunamadı", 404);
        // updateMany ilişki alanı kabul etmediği için doğrudan alan yazılır
        const moved = await prisma.product.updateMany({
          where,
          data: { categoryId: body.categoryId, subCategoryId: null },
        });
        await logAudit({
          user: admin,
          action: "BULK",
          entity: "product",
          summary: `${moved.count} ürün "${category.name}" kategorisine taşındı`,
        });
        return ok({ count: moved.count });
      }
      default:
        return fail("Bilinmeyen işlem", 400);
    }

    const result = await prisma.product.updateMany({ where, data });

    await logAudit({
      user: admin,
      action: "BULK",
      entity: "product",
      summary: `${result.count} ürün ${ACTION_LABELS[body.action]}`,
    });

    return ok({ count: result.count });
  } catch (error) {
    return handleError(error);
  }
}
