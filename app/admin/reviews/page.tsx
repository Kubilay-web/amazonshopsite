import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink } from "lucide-react";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { SafeImage } from "@/components/ui/safe-image";
import { Rating } from "@/components/ui/rating";
import { AdminSearch } from "@/components/admin/admin-search";
import { DeleteButton } from "@/components/admin/delete-button";
import { Pagination } from "@/components/ui/pagination";
import { formatDateTime, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const rating = Number(typeof sp.rating === "string" ? sp.rating : 0);
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where: Prisma.ReviewWhereInput = {
    ...(rating >= 1 && rating <= 5 ? { rating } : {}),
    ...(q
      ? {
          OR: [
            { comment: { contains: q, mode: "insensitive" } },
            { title: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [reviews, total, byRating] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, title: true, slug: true, images: true } },
      },
    }),
    prisma.review.count({ where }),
    prisma.review.groupBy({ by: ["rating"], _count: { _all: true } }),
  ]);

  const countBy = Object.fromEntries(byRating.map((r) => [r.rating, r._count._all]));
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const query = q ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Yorumlar</h1>
        <p className="text-sm text-zinc-600">{total} yorum</p>
      </div>

      <Suspense fallback={null}>
        <AdminSearch placeholder="Yorum metni veya başlık ara…" />
      </Suspense>

      {/* Puan filtresi */}
      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        <Link
          href={`/admin/reviews${q ? `?q=${encodeURIComponent(q)}` : ""}`}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
            !rating ? "border-amz-orange bg-amz-orange font-medium" : "border-zinc-300 bg-white"
          }`}
        >
          Tümü
        </Link>
        {[5, 4, 3, 2, 1].map((star) => (
          <Link
            key={star}
            href={`/admin/reviews?rating=${star}${query}`}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
              rating === star
                ? "border-amz-orange bg-amz-orange font-medium"
                : "border-zinc-300 bg-white"
            }`}
          >
            {star}★ ({countBy[star] ?? 0})
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-200 text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-3 py-2.5">Ürün</th>
              <th className="px-3 py-2.5">Yorum</th>
              <th className="px-3 py-2.5">Kullanıcı</th>
              <th className="px-3 py-2.5">Tarih</th>
              <th className="px-3 py-2.5 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {reviews.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-zinc-500">
                  Yorum bulunamadı.
                </td>
              </tr>
            )}
            {reviews.map((review) => (
              <tr key={review.id} className="hover:bg-zinc-50">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded border border-zinc-200 bg-white">
                      <SafeImage
                        src={review.product.images[0]}
                        alt={review.product.title}
                        fill
                        sizes="40px"
                        className="object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/products/${review.product.id}`}
                        className="block text-zinc-900 hover:text-amz-link"
                      >
                        {truncate(review.product.title, 34)}
                      </Link>
                      <Link
                        href={`/product/${review.product.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs text-amz-link hover:text-amz-link-hover"
                      >
                        Mağazada gör <ExternalLink className="size-3" />
                      </Link>
                    </div>
                  </div>
                </td>
                <td className="max-w-100 px-3 py-2.5">
                  <Rating value={review.rating} showCount={false} />
                  {review.title && (
                    <p className="mt-0.5 font-medium text-zinc-900">{review.title}</p>
                  )}
                  <p className="text-zinc-600">{truncate(review.comment, 160)}</p>
                </td>
                <td className="px-3 py-2.5">
                  <Link
                    href={`/admin/users/${review.user.id}`}
                    className="block text-zinc-900 hover:text-amz-link"
                  >
                    {review.user.name}
                  </Link>
                  <p className="truncate text-xs text-zinc-500">{review.user.email}</p>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-zinc-600">
                  {formatDateTime(review.createdAt)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <DeleteButton
                    endpoint={`/api/admin/reviews?id=${review.id}`}
                    confirmLabel="Yorum silinsin mi?"
                  />
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
