import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { categorySchema } from "@/lib/validators";
import { getCategories } from "@/lib/queries";
import { fail, handleError, ok } from "@/lib/api";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    return ok({ categories: await getCategories() });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const data = categorySchema.parse(await request.json());
    const slug = data.slug ? slugify(data.slug) : slugify(data.name);

    const exists = await prisma.category.findFirst({
      where: { OR: [{ slug }, { name: data.name }] },
    });
    if (exists) return fail("Bu kategori zaten var", 409, { name: "Bu kategori zaten var" });

    const category = await prisma.category.create({
      data: { name: data.name, slug, image: data.image || null, order: data.order },
    });
    return ok({ category }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
