import Link from "next/link";
import { Suspense } from "react";
import { Pencil, Plus } from "lucide-react";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { SafeImage } from "@/components/ui/safe-image";
import { DeleteButton } from "@/components/admin/delete-button";
import { AdminSearch } from "@/components/admin/admin-search";
import { Pagination } from "@/components/ui/pagination";
import { finalPrice, formatPrice, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where: Prisma.ProductWhereInput = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { brand: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { category: { select: { name: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Ürünler</h1>
          <p className="text-sm text-zinc-600">{total} ürün</p>
        </div>
        <Link href="/admin/products/new" className="btn-amz">
          <Plus className="size-4" /> Yeni ürün
        </Link>
      </div>

      <Suspense fallback={null}>
        <AdminSearch placeholder="Ürün adı, marka veya SKU ara…" />
      </Suspense>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-200 text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-3 py-2.5">Ürün</th>
              <th className="px-3 py-2.5">Kategori</th>
              <th className="px-3 py-2.5 text-right">Fiyat</th>
              <th className="px-3 py-2.5 text-right">Stok</th>
              <th className="px-3 py-2.5 text-right">Satış</th>
              <th className="px-3 py-2.5">Durum</th>
              <th className="px-3 py-2.5 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-zinc-500">
                  Ürün bulunamadı.
                </td>
              </tr>
            )}
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-zinc-50">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="relative size-11 shrink-0 overflow-hidden rounded border border-zinc-200 bg-white">
                      <SafeImage
                        src={product.images[0]}
                        alt={product.title}
                        fill
                        sizes="44px"
                        className="object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900">
                        {truncate(product.title, 50)}
                      </p>
                      <p className="text-xs text-zinc-500">{product.brand ?? "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-zinc-600">{product.category.name}</td>
                <td className="px-3 py-2.5 text-right">
                  <p className="font-semibold text-zinc-900">
                    {formatPrice(finalPrice(product.price, product.discountPercent))}
                  </p>
                  {product.discountPercent > 0 && (
                    <p className="text-xs text-zinc-400 line-through">
                      {formatPrice(product.price)}
                    </p>
                  )}
                </td>
                <td
                  className={`px-3 py-2.5 text-right font-medium ${
                    product.stock <= 5 ? "text-rose-600" : "text-zinc-700"
                  }`}
                >
                  {product.stock}
                </td>
                <td className="px-3 py-2.5 text-right text-zinc-600">{product.sold}</td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        product.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      {product.isActive ? "Yayında" : "Pasif"}
                    </span>
                    {product.featured && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700">
                        Öne çıkan
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="inline-flex items-center gap-1 text-xs text-amz-link hover:text-amz-link-hover"
                    >
                      <Pencil className="size-3.5" /> Düzenle
                    </Link>
                    <DeleteButton endpoint={`/api/products/${product.id}`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Suspense fallback={null}>
        <Pagination page={page} pages={pages} />
      </Suspense>
    </div>
  );
}
