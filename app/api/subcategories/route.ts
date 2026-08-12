import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { subCategorySchema } from "@/lib/validators";
import { fail, handleError, ok } from "@/lib/api";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const categoryId = request.nextUrl.searchParams.get("categoryId") ?? undefined;
    const subCategories = await prisma.subCategory.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: { name: "asc" },
      include: { category: { select: { id: true, name: true } } },
    });
    return ok({ subCategories });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const data = subCategorySchema.parse(await request.json());
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);

    const exists = await prisma.subCategory.findUnique({ where: { slug } });
    if (exists) return fail("Bu alt kategori zaten var", 409, { name: "Zaten var" });

    const subCategory = await prisma.subCategory.create({
      data: {
        name: data.name,
        slug,
        image: data.image || null,
        categoryId: data.categoryId,
      },
    });
    return ok({ subCategory }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
