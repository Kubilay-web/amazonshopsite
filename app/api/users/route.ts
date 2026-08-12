import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handleError, ok } from "@/lib/api";

/** Yönetici: kullanıcı listesi + arama. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const sp = request.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const page = Math.max(1, Number(sp.get("page") ?? 1));
    const perPage = Math.min(100, Number(sp.get("perPage") ?? 25));

    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          blocked: true,
          createdAt: true,
          _count: { select: { orders: true, reviews: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return ok({ users, total, page, pages: Math.max(1, Math.ceil(total / perPage)) });
  } catch (error) {
    return handleError(error);
  }
}
