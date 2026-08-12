import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PackageSearch } from "lucide-react";
import { getBrands, getCategories, getCategoryBySlug, searchProducts } from "@/lib/queries";
import { FilterSidebar } from "@/components/catalog/filter-sidebar";
import { SortSelect } from "@/components/catalog/sort-select";
import { ProductGrid } from "@/components/product/product-grid";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return { title: category ? category.name : "Kategori" };
}

function num(value: string | string[] | undefined) {
  if (typeof value !== "string" || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}
function str(value: string | string[] | undefined) {
  return typeof value === "string" && value !== "" ? value : undefined;
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [{ products, total, page, pages }, categories, brands] = await Promise.all([
    searchProducts({
      category: slug,
      subCategory: str(sp.subCategory),
      brand: str(sp.brand),
      q: str(sp.q),
      minPrice: num(sp.minPrice),
      maxPrice: num(sp.maxPrice),
      rating: num(sp.rating),
      sort: str(sp.sort),
      page: num(sp.page) ?? 1,
      discounted: sp.discounted === "true" ? true : undefined,
    }),
    getCategories(),
    getBrands(slug),
  ]);

  return (
    <div className="mx-auto max-w-[1500px] px-2 py-4 sm:px-4">
      <nav className="mb-3 flex items-center gap-1.5 text-sm text-zinc-600">
        <Link href="/" className="hover:text-amz-link-hover">
          Ana sayfa
        </Link>
        <span>›</span>
        <span className="font-medium text-zinc-900">{category.name}</span>
      </nav>

      <div className="mb-3 flex flex-col gap-3 rounded-lg bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-zinc-900 sm:text-xl">{category.name}</h1>
          <p className="text-sm text-zinc-600">{total} ürün</p>
        </div>
        <Suspense fallback={null}>
          <SortSelect />
        </Suspense>
      </div>

      {category.subCategories.length > 0 && (
        <div className="scrollbar-hide mb-3 flex gap-2 overflow-x-auto pb-1">
          <Link
            href={`/category/${slug}`}
            className="btn-amz-outline shrink-0 whitespace-nowrap"
          >
            Tümü
          </Link>
          {category.subCategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/category/${slug}?subCategory=${sub.slug}`}
              className="btn-amz-outline shrink-0 whitespace-nowrap"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row">
        <Suspense fallback={null}>
          <FilterSidebar
            categories={categories}
            brands={brands}
            activeCategorySlug={slug}
          />
        </Suspense>

        <div className="min-w-0 flex-1">
          {products.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="size-12" />}
              title="Bu kategoride ürün yok"
              description="Filtreleri değiştirin veya diğer kategorilere göz atın."
              actionLabel="Tüm ürünler"
              actionHref="/search"
            />
          ) : (
            <>
              <ProductGrid products={products} />
              <Suspense fallback={null}>
                <Pagination page={page} pages={pages} />
              </Suspense>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
