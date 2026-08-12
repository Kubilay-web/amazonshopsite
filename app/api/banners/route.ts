import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { bannerSchema } from "@/lib/validators";
import { handleError, ok } from "@/lib/api";

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: [{ position: "asc" }, { order: "asc" }],
    });
    return ok({ banners });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const data = bannerSchema.parse(await request.json());
    const banner = await prisma.banner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle || null,
        image: data.image,
        link: data.link || "/",
        position: data.position,
        order: data.order,
        active: data.active,
      },
    });
    return ok({ banner }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
