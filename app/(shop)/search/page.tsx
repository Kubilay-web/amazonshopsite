import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { getBrands, getCategories, searchProducts } from "@/lib/queries";
import { FilterSidebar } from "@/components/catalog/filter-sidebar";
import { SortSelect } from "@/components/catalog/sort-select";
import { ProductGrid } from "@/components/product/product-grid";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  return { title: q ? `"${q}" için sonuçlar` : "Tüm ürünler" };
}

function num(value: string | string[] | undefined) {
  if (typeof value !== "string" || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function str(value: string | string[] | undefined) {
  return typeof value === "string" && value !== "" ? value : undefined;
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;

  const filters = {
    q: str(sp.q),
    category: str(sp.category),
    subCategory: str(sp.subCategory),
    brand: str(sp.brand),
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    rating: num(sp.rating),
    sort: str(sp.sort),
    page: num(sp.page) ?? 1,
    featured: sp.featured === "true" ? true : undefined,
    discounted: sp.discounted === "true" ? true : undefined,
  };

  const [{ products, total, page, pages }, categories, brands] = await Promise.all([
    searchProducts(filters),
    getCategories(),
    getBrands(filters.category),
  ]);

  return (
    <div className="mx-auto max-w-[1500px] px-2 py-4 sm:px-4">
      <div className="mb-3 flex flex-col gap-3 rounded-lg bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-zinc-900 sm:text-lg">
            {filters.q ? `"${filters.q}" için sonuçlar` : "Tüm ürünler"}
          </h1>
          <p className="text-sm text-zinc-600">{total} ürün bulundu</p>
        </div>
        <div className="flex items-center gap-2">
          <Suspense fallback={null}>
            <SortSelect />
          </Suspense>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <Suspense fallback={null}>
          <FilterSidebar categories={categories} brands={brands} />
        </Suspense>

        <div className="min-w-0 flex-1">
          {products.length === 0 ? (
            <EmptyState
              icon={<SearchX className="size-12" />}
              title="Aramanızla eşleşen ürün bulunamadı"
              description="Farklı anahtar kelimeler deneyin veya filtreleri temizleyin."
              actionLabel="Tüm ürünlere göz at"
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
