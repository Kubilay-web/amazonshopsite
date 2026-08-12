import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import { ProductGallery } from "@/components/product/product-gallery";
import { BuyBox } from "@/components/product/buy-box";
import { Reviews } from "@/components/product/reviews";
import { ProductRow } from "@/components/product/product-row";
import { Rating } from "@/components/ui/rating";
import { truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Ürün bulunamadı" };

  return {
    title: product.title,
    description: truncate(product.description, 155),
    openGraph: {
      title: product.title,
      description: truncate(product.description, 155),
      images: product.images.slice(0, 1),
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.isActive) notFound();

  const related = await getRelatedProducts(product.categoryId, product.id);

  return (
    <div className="mx-auto max-w-[1500px] px-2 py-4 sm:px-4">
      <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-zinc-600">
        <Link href="/" className="hover:text-amz-link-hover">
          Ana sayfa
        </Link>
        <span>›</span>
        <Link href={`/category/${product.category.slug}`} className="hover:text-amz-link-hover">
          {product.category.name}
        </Link>
        {product.subCategory && (
          <>
            <span>›</span>
            <Link
              href={`/category/${product.category.slug}?subCategory=${product.subCategory.slug}`}
              className="hover:text-amz-link-hover"
            >
              {product.subCategory.name}
            </Link>
          </>
        )}
      </nav>

      <div className="rounded-lg bg-white p-3 sm:p-5">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Görseller */}
          <div className="lg:col-span-5">
            <ProductGallery images={product.images} title={product.title} />
          </div>

          {/* Bilgi */}
          <div className="space-y-3 lg:col-span-4">
            {product.brand && (
              <Link
                href={`/search?brand=${encodeURIComponent(product.brand)}`}
                className="text-sm text-amz-link hover:text-amz-link-hover"
              >
                {product.brand} mağazasını ziyaret edin
              </Link>
            )}
            <h1 className="text-xl font-medium leading-snug text-zinc-900 sm:text-2xl">
              {product.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 border-b border-amz-border pb-3">
              <Rating value={product.rating} size="md" showCount={false} />
              <span className="text-sm text-amz-link">
                {product.numReviews} değerlendirme
              </span>
              {product.sold > 0 && (
                <span className="text-sm text-zinc-600">· {product.sold} adet satıldı</span>
              )}
            </div>

            <div className="space-y-2 text-sm leading-relaxed text-zinc-700">
              <h2 className="font-bold text-zinc-900">Ürün hakkında</h2>
              <p className="whitespace-pre-line">{product.description}</p>
            </div>

            {product.details && (
              <div className="space-y-2 border-t border-amz-border pt-3 text-sm text-zinc-700">
                <h2 className="font-bold text-zinc-900">Ürün detayları</h2>
                <p className="whitespace-pre-line">{product.details}</p>
              </div>
            )}

            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-amz-border pt-3 text-sm">
              {product.sku && (
                <>
                  <dt className="text-zinc-500">Stok kodu</dt>
                  <dd className="text-zinc-800">{product.sku}</dd>
                </>
              )}
              <dt className="text-zinc-500">Kategori</dt>
              <dd className="text-zinc-800">{product.category.name}</dd>
              {product.tags.length > 0 && (
                <>
                  <dt className="text-zinc-500">Etiketler</dt>
                  <dd className="text-zinc-800">{product.tags.join(", ")}</dd>
                </>
              )}
            </dl>
          </div>

          {/* Satın alma */}
          <div className="lg:col-span-3">
            <BuyBox
              product={{
                id: product.id,
                slug: product.slug,
                title: product.title,
                images: product.images,
                price: product.price,
                discountPercent: product.discountPercent,
                stock: product.stock,
                sizes: product.sizes,
                colors: product.colors,
                shippingFree: product.shippingFree,
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-white p-4 sm:p-5">
        <Reviews
          productId={product.id}
          rating={product.rating}
          numReviews={product.numReviews}
          reviews={product.reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            title: r.title,
            comment: r.comment,
            createdAt: r.createdAt,
            user: r.user,
          }))}
        />
      </div>

      <div className="mt-4">
        <ProductRow title="Benzer ürünler" products={related} />
      </div>
    </div>
  );
}
