import Link from "next/link";
import { Suspense } from "react";
import { Download, Plus } from "lucide-react";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getSettings } from "@/lib/settings";
import { AdminSearch } from "@/components/admin/admin-search";
import { ProductTable } from "@/components/admin/product-table";
import { Pagination } from "@/components/ui/pagination";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

const FILTERS = [
  { key: "", label: "Tümü" },
  { key: "active", label: "Yayında" },
  { key: "passive", label: "Pasif" },
  { key: "featured", label: "Öne çıkan" },
  { key: "discounted", label: "İndirimli" },
];

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const filter = typeof sp.filter === "string" ? sp.filter : "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const filterWhere: Prisma.ProductWhereInput =
    filter === "active"
      ? { isActive: true }
      : filter === "passive"
        ? { isActive: false }
        : filter === "featured"
          ? { featured: true }
          : filter === "discounted"
            ? { discountPercent: { gt: 0 } }
            : {};

  const where: Prisma.ProductWhereInput = {
    ...filterWhere,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [products, total, categories, settings] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        title: true,
        brand: true,
        images: true,
        price: true,
        discountPercent: true,
        stock: true,
        sold: true,
        isActive: true,
        featured: true,
        category: { select: { name: true } },
      },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    getSettings(),
  ]);

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const query = q ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Ürünler</h1>
          <p className="text-sm text-zinc-600">{total} ürün</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/api/admin/export?type=products" className="btn-amz-outline">
            <Download className="size-4" /> CSV
          </a>
          <Link href="/admin/products/new" className="btn-amz">
            <Plus className="size-4" /> Yeni ürün
          </Link>
        </div>
      </div>

      <Suspense fallback={null}>
        <AdminSearch placeholder="Ürün adı, marka veya SKU ara…" />
      </Suspense>

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((item) => (
          <Link
            key={item.key || "all"}
            href={`/admin/products${item.key ? `?filter=${item.key}${query}` : q ? `?q=${encodeURIComponent(q)}` : ""}`}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
              filter === item.key
                ? "border-amz-orange bg-amz-orange font-medium"
                : "border-zinc-300 bg-white hover:bg-zinc-50"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <ProductTable
        categories={categories}
        lowStockThreshold={settings.lowStockThreshold}
        products={products.map((p) => ({
          id: p.id,
          title: p.title,
          brand: p.brand,
          images: p.images,
          price: p.price,
          discountPercent: p.discountPercent,
          stock: p.stock,
          sold: p.sold,
          isActive: p.isActive,
          featured: p.featured,
          categoryName: p.category.name,
        }))}
      />

      <Suspense fallback={null}>
        <Pagination page={page} pages={pages} />
      </Suspense>
    </div>
  );
}
