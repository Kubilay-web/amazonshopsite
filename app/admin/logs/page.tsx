import Link from "next/link";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { Pagination } from "@/components/ui/pagination";
import { LogCleanup } from "@/components/admin/log-cleanup";
import {
  AUDIT_ACTION_COLORS,
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
  formatDateTime,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

const PER_PAGE = 50;
const ACTIONS = ["CREATE", "UPDATE", "DELETE", "BULK", "SETTINGS"];
const ENTITIES = ["product", "order", "user", "review", "category", "coupon", "banner", "setting"];

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const action = typeof sp.action === "string" && ACTIONS.includes(sp.action) ? sp.action : "";
  const entity = typeof sp.entity === "string" && ENTITIES.includes(sp.entity) ? sp.entity : "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action } : {}),
    ...(entity ? { entity } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  function href(next: { action?: string; entity?: string }) {
    const params = new URLSearchParams();
    const a = next.action ?? action;
    const e = next.entity ?? entity;
    if (a) params.set("action", a);
    if (e) params.set("entity", e);
    const query = params.toString();
    return `/admin/logs${query ? `?${query}` : ""}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">İşlem kaydı</h1>
          <p className="text-sm text-zinc-600">
            {total} kayıt · yönetim panelinde yapılan tüm değişiklikler
          </p>
        </div>
        <LogCleanup />
      </div>

      <div className="space-y-2">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          <Link
            href={href({ action: "" })}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
              !action ? "border-amz-orange bg-amz-orange font-medium" : "border-zinc-300 bg-white"
            }`}
          >
            Tüm işlemler
          </Link>
          {ACTIONS.map((a) => (
            <Link
              key={a}
              href={href({ action: a })}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
                action === a
                  ? "border-amz-orange bg-amz-orange font-medium"
                  : "border-zinc-300 bg-white"
              }`}
            >
              {AUDIT_ACTION_LABELS[a]}
            </Link>
          ))}
        </div>

        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          <Link
            href={href({ entity: "" })}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
              !entity ? "border-zinc-800 bg-zinc-800 font-medium text-white" : "border-zinc-300 bg-white"
            }`}
          >
            Tüm kayıtlar
          </Link>
          {ENTITIES.map((e) => (
            <Link
              key={e}
              href={href({ entity: e })}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
                entity === e
                  ? "border-zinc-800 bg-zinc-800 font-medium text-white"
                  : "border-zinc-300 bg-white"
              }`}
            >
              {AUDIT_ENTITY_LABELS[e]}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-175 text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-3 py-2.5">Tarih</th>
              <th className="px-3 py-2.5">İşlem</th>
              <th className="px-3 py-2.5">Kayıt</th>
              <th className="px-3 py-2.5">Özet</th>
              <th className="px-3 py-2.5">Yönetici</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-zinc-500">
                  Henüz kayıt yok. Panelde yapılan değişiklikler buraya düşer.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-zinc-50">
                <td className="whitespace-nowrap px-3 py-2.5 text-zinc-600">
                  {formatDateTime(log.createdAt)}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] ${
                      AUDIT_ACTION_COLORS[log.action] ?? AUDIT_ACTION_COLORS.LOGIN
                    }`}
                  >
                    {AUDIT_ACTION_LABELS[log.action] ?? log.action}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-zinc-600">
                  {AUDIT_ENTITY_LABELS[log.entity] ?? log.entity}
                </td>
                <td className="px-3 py-2.5 text-zinc-800">{log.summary}</td>
                <td className="px-3 py-2.5">
                  <p className="text-zinc-900">{log.userName}</p>
                  <p className="text-xs text-zinc-500">{log.userEmail}</p>
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
