import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { addressSchema } from "@/lib/validators";
import { fail, handleError, ok } from "@/lib/api";
import { isValidObjectId } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!isValidObjectId(id)) return fail("Geçersiz kimlik", 400);

    const owned = await prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!owned) return fail("Adres bulunamadı", 404);

    const data = addressSchema.parse(await request.json());

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        isDefault: data.isDefault ?? owned.isDefault,
      },
    });

    return ok({ address });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const deleted = await prisma.address.deleteMany({ where: { id, userId: user.id } });
    if (deleted.count === 0) return fail("Adres bulunamadı", 404);

    // Varsayılan adres silindiyse ilk adresi varsayılan yap
    const remaining = await prisma.address.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
    if (remaining) {
      const hasDefault = await prisma.address.count({
        where: { userId: user.id, isDefault: true },
      });
      if (hasDefault === 0) {
        await prisma.address.update({ where: { id: remaining.id }, data: { isDefault: true } });
      }
    }

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
