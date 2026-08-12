import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { handleError, ok } from "@/lib/api";

/** Yönetici tüm siparişleri, kullanıcı yalnızca kendi siparişlerini görür. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const sp = request.nextUrl.searchParams;
    const status = sp.get("status") ?? undefined;
    const page = Math.max(1, Number(sp.get("page") ?? 1));
    const perPage = Math.min(50, Number(sp.get("perPage") ?? 20));
    const scope = sp.get("scope");

    const isAdminScope = scope === "all" && user.role === "ADMIN";

    const where = {
      ...(isAdminScope ? {} : { userId: user.id }),
      ...(status ? { status: status as never } : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        include: isAdminScope
          ? { user: { select: { id: true, name: true, email: true } } }
          : undefined,
      }),
      prisma.order.count({ where }),
    ]);

    return ok({ orders, total, page, pages: Math.max(1, Math.ceil(total / perPage)) });
  } catch (error) {
    return handleError(error);
  }
}

export async function HEAD() {
  const user = await getCurrentUser();
  return new Response(null, { status: user ? 200 : 401 });
}
