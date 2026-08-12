import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCategories } from "@/lib/queries";
import { ProductForm } from "@/components/admin/product-form";
import { isValidObjectId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    getCategories(),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-4">
      <nav className="text-sm text-zinc-600">
        <Link href="/admin/products" className="text-amz-link hover:text-amz-link-hover">
          Ürünler
        </Link>
        <span className="mx-1">›</span>
        <span className="line-clamp-1">{product.title}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-zinc-900">Ürünü düzenle</h1>
        <Link
          href={`/product/${product.slug}`}
          target="_blank"
          className="text-sm text-amz-link hover:text-amz-link-hover"
        >
          Mağazada görüntüle ↗
        </Link>
      </div>

      <ProductForm
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          subCategories: c.subCategories,
        }))}
        initial={{
          id: product.id,
          title: product.title,
          slug: product.slug,
          description: product.description,
          details: product.details ?? "",
          brand: product.brand ?? "",
          sku: product.sku ?? "",
          images: product.images,
          price: product.price,
          discountPercent: product.discountPercent,
          stock: product.stock,
          colors: product.colors.map((c) => ({ name: c.name, hex: c.hex })),
          sizes: product.sizes,
          tags: product.tags,
          featured: product.featured,
          isActive: product.isActive,
          shippingFree: product.shippingFree,
          categoryId: product.categoryId,
          subCategoryId: product.subCategoryId ?? "",
        }}
      />
    </div>
  );
}
