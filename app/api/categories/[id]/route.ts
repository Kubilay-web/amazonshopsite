import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { categorySchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { fail, handleError, ok } from "@/lib/api";
import { slugify, isValidObjectId } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Geçersiz kimlik", 400);

    const data = categorySchema.parse(await request.json());
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);

    const category = await prisma.category.update({
      where: { id },
      data: { name: data.name, slug, image: data.image || null, order: data.order },
    });
    await logAudit({
      user: admin,
      action: "UPDATE",
      entity: "category",
      entityId: category.id,
      summary: `Kategori güncellendi: ${category.name}`,
    });

    return ok({ category });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Geçersiz kimlik", 400);

    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return fail(`Bu kategoride ${productCount} ürün var, önce ürünleri taşıyın`, 409);
    }

    await prisma.$transaction([
      prisma.subCategory.deleteMany({ where: { categoryId: id } }),
      prisma.category.delete({ where: { id } }),
    ]);

    await logAudit({
      user: admin,
      action: "DELETE",
      entity: "category",
      entityId: id,
      summary: "Kategori ve alt kategorileri silindi",
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
