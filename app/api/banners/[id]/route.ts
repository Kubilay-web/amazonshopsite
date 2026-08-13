import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { bannerSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { fail, handleError, ok } from "@/lib/api";
import { isValidObjectId } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Geçersiz kimlik", 400);

    const data = bannerSchema.parse(await request.json());
    const banner = await prisma.banner.update({
      where: { id },
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
    await logAudit({
      user: admin,
      action: "UPDATE",
      entity: "banner",
      entityId: banner.id,
      summary: `Banner güncellendi: ${banner.title}`,
    });

    return ok({ banner });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const banner = await prisma.banner.delete({ where: { id } });

    await logAudit({
      user: admin,
      action: "DELETE",
      entity: "banner",
      entityId: id,
      summary: `Banner silindi: ${banner.title}`,
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
