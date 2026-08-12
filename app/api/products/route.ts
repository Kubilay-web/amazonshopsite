import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validators";
import { searchProducts } from "@/lib/queries";
import { fail, handleError, ok } from "@/lib/api";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const num = (key: string) => {
      const v = sp.get(key);
      return v != null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : undefined;
    };

    const result = await searchProducts({
      q: sp.get("q") ?? undefined,
      category: sp.get("category") ?? undefined,
      subCategory: sp.get("subCategory") ?? undefined,
      brand: sp.get("brand") ?? undefined,
      minPrice: num("minPrice"),
      maxPrice: num("maxPrice"),
      rating: num("rating"),
      sort: sp.get("sort") ?? undefined,
      page: num("page") ?? 1,
      perPage: num("perPage") ?? 24,
      featured: sp.get("featured") === "true" ? true : undefined,
      discounted: sp.get("discounted") === "true" ? true : undefined,
    });

    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const data = productSchema.parse(body);

    const slug = data.slug ? slugify(data.slug) : slugify(data.title);
    const exists = await prisma.product.findUnique({ where: { slug } });
    if (exists) return fail("Bu slug zaten kullanılıyor", 409, { slug: "Bu slug zaten kullanılıyor" });

    const product = await prisma.product.create({
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

    return ok({ product }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
