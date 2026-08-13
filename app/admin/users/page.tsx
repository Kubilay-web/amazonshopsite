import Link from "next/link";
import { Suspense } from "react";
import { Download } from "lucide-react";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { AdminSearch } from "@/components/admin/admin-search";
import { UserActions } from "@/components/admin/user-actions";
import { DeleteButton } from "@/components/admin/delete-button";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PER_PAGE = 25;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await getCurrentUser();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where: Prisma.UserWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        blocked: true,
        createdAt: true,
        _count: { select: { orders: true, reviews: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Kullanıcılar</h1>
          <p className="text-sm text-zinc-600">{total} kullanıcı</p>
        </div>
        <a href="/api/admin/export?type=users" className="btn-amz-outline">
          <Download className="size-4" /> CSV indir
        </a>
      </div>

      <Suspense fallback={null}>
        <AdminSearch placeholder="İsim veya e-posta ara…" />
      </Suspense>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-200 text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-3 py-2.5">Kullanıcı</th>
              <th className="px-3 py-2.5">Kayıt</th>
              <th className="px-3 py-2.5 text-center">Sipariş</th>
              <th className="px-3 py-2.5 text-center">Yorum</th>
              <th className="px-3 py-2.5">Durum</th>
              <th className="px-3 py-2.5 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-zinc-500">
                  Kullanıcı bulunamadı.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-50">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-600">
                      {user.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="font-medium text-zinc-900 hover:text-amz-link"
                      >
                        {user.name}
                      </Link>
                      <p className="truncate text-xs text-zinc-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-zinc-600">{formatDate(user.createdAt)}</td>
                <td className="px-3 py-2.5 text-center text-zinc-600">{user._count.orders}</td>
                <td className="px-3 py-2.5 text-center text-zinc-600">{user._count.reviews}</td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        user.role === "ADMIN"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {user.role === "ADMIN" ? "Yönetici" : "Kullanıcı"}
                    </span>
                    {user.blocked && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] text-rose-700">
                        Askıda
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-xs text-amz-link hover:text-amz-link-hover"
                    >
                      Detay
                    </Link>
                    <UserActions
                      userId={user.id}
                      role={user.role}
                      blocked={user.blocked}
                      isSelf={me?.id === user.id}
                    />
                    {me?.id !== user.id && (
                      <DeleteButton
                        endpoint={`/api/users/${user.id}`}
                        confirmLabel="Kullanıcı ve tüm verileri silinsin mi?"
                      />
                    )}
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
