import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validators";
import { fail, handleError, ok } from "@/lib/api";
import { slugify, isValidObjectId } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Geçersiz kimlik", 400);

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        subCategory: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!product) return fail("Ürün bulunamadı", 404);
    return ok({ product });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Geçersiz kimlik", 400);

    const body = await request.json();
    const data = productSchema.parse(body);
    const slug = data.slug ? slugify(data.slug) : slugify(data.title);

    const clash = await prisma.product.findFirst({
      where: { slug, id: { not: id } },
      select: { id: true },
    });
    if (clash) return fail("Bu slug başka bir üründe kullanılıyor", 409, { slug: "Slug kullanımda" });

    const product = await prisma.product.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        description: data.description,
        details: data.details || null,
        brand: data.brand || null,
        sku: data.sku || null,
        images: data.images,
        price: data.price,
        discountPercent: data.discountPercent,
        stock: data.stock,
        colors: data.colors,
        sizes: data.sizes,
        tags: data.tags.map((t) => t.toLowerCase()),
        featured: data.featured,
        isActive: data.isActive,
        shippingFree: data.shippingFree,
        categoryId: data.categoryId,
        subCategoryId: data.subCategoryId ? data.subCategoryId : null,
      },
    });

    return ok({ product });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Geçersiz kimlik", 400);

    await prisma.$transaction([
      prisma.review.deleteMany({ where: { productId: id } }),
      prisma.wishlist.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
