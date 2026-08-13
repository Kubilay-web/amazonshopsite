import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { handleError, ok } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const sp = request.nextUrl.searchParams;
    const entity = sp.get("entity")?.trim();
    const action = sp.get("action")?.trim();
    const page = Math.max(1, Number(sp.get("page") ?? 1));
    const perPage = Math.min(200, Number(sp.get("perPage") ?? 50));

    const where: Prisma.AuditLogWhereInput = {
      ...(entity ? { entity } : {}),
      ...(action ? { action } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return ok({ logs, total, page, pages: Math.max(1, Math.ceil(total / perPage)) });
  } catch (error) {
    return handleError(error);
  }
}

/** Kayıt defterini temizler (yalnızca 30 günden eski kayıtlar). */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const all = request.nextUrl.searchParams.get("all") === "1";
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.auditLog.deleteMany({
      where: all ? {} : { createdAt: { lt: cutoff } },
    });

    await logAudit({
      user: admin,
      action: "DELETE",
      entity: "setting",
      summary: `${result.count} denetim kaydı temizlendi${all ? " (tümü)" : " (30 gün öncesi)"}`,
    });

    return ok({ count: result.count });
  } catch (error) {
    return handleError(error);
  }
}
