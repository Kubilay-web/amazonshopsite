import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { subCategorySchema } from "@/lib/validators";
import { fail, handleError, ok } from "@/lib/api";
import { slugify, isValidObjectId } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Geçersiz kimlik", 400);

    const data = subCategorySchema.parse(await request.json());
    const subCategory = await prisma.subCategory.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug ? slugify(data.slug) : slugify(data.name),
        image: data.image || null,
        categoryId: data.categoryId,
      },
    });
    return ok({ subCategory });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Geçersiz kimlik", 400);

    const count = await prisma.product.count({ where: { subCategoryId: id } });
    if (count > 0) return fail(`Bu alt kategoride ${count} ürün var`, 409);

    await prisma.subCategory.delete({ where: { id } });
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
