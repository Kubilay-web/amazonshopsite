import Link from "next/link";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getSettings } from "@/lib/settings";
import { AdminSearch } from "@/components/admin/admin-search";
import { InventoryTable } from "@/components/admin/inventory-table";
import { Pagination } from "@/components/ui/pagination";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PER_PAGE = 30;

const FILTERS = [
  { key: "", label: "Tümü" },
  { key: "low", label: "Kritik stok" },
  { key: "out", label: "Tükendi" },
  { key: "discounted", label: "İndirimli" },
  { key: "passive", label: "Pasif" },
];

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const filter = typeof sp.filter === "string" ? sp.filter : "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const settings = await getSettings();
  const threshold = settings.lowStockThreshold;

  const filterWhere: Prisma.ProductWhereInput =
    filter === "low"
      ? { stock: { lte: threshold, gt: 0 } }
      : filter === "out"
        ? { stock: { lte: 0 } }
        : filter === "discounted"
          ? { discountPercent: { gt: 0 } }
          : filter === "passive"
            ? { isActive: false }
            : {};

  const where: Prisma.ProductWhereInput = {
    ...filterWhere,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [products, total, lowCount, outCount, stockValue] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ stock: "asc" }, { title: "asc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        title: true,
        sku: true,
        brand: true,
        images: true,
        price: true,
        discountPercent: true,
        stock: true,
        sold: true,
        isActive: true,
        category: { select: { name: true } },
      },
    }),
    prisma.product.count({ where }),
    prisma.product.count({ where: { stock: { lte: threshold, gt: 0 } } }),
    prisma.product.count({ where: { stock: { lte: 0 } } }),
    prisma.product.findMany({ select: { price: true, stock: true } }),
  ]);

  const totalStockValue = stockValue.reduce((sum, p) => sum + p.price * p.stock, 0);
  const totalUnits = stockValue.reduce((sum, p) => sum + p.stock, 0);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const query = q ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Stok &amp; fiyat</h1>
          <p className="text-sm text-zinc-600">
            {total} ürün listeleniyor · toplam {totalUnits} adet ·{" "}
            {formatPrice(totalStockValue)} stok değeri
          </p>
        </div>
        <p className="text-sm text-zinc-600">
          <span className="font-semibold text-amber-700">{lowCount}</span> kritik ·{" "}
          <span className="font-semibold text-rose-700">{outCount}</span> tükendi
          <span className="ml-2 text-xs text-zinc-500">(eşik: {threshold})</span>
        </p>
      </div>

      <Suspense fallback={null}>
        <AdminSearch placeholder="Ürün adı, SKU veya marka ara…" />
      </Suspense>

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((item) => (
          <Link
            key={item.key || "all"}
            href={`/admin/inventory${item.key ? `?filter=${item.key}${query}` : q ? `?q=${encodeURIComponent(q)}` : ""}`}
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

      <InventoryTable
        lowStockThreshold={threshold}
        products={products.map((p) => ({
          id: p.id,
          title: p.title,
          sku: p.sku,
          brand: p.brand,
          images: p.images,
          price: p.price,
          discountPercent: p.discountPercent,
          stock: p.stock,
          sold: p.sold,
          isActive: p.isActive,
          categoryName: p.category.name,
        }))}
      />

      <Suspense fallback={null}>
        <Pagination page={page} pages={pages} />
      </Suspense>
    </div>
  );
}
