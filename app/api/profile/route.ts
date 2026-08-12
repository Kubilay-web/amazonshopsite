import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, hashPassword, requireUser, setAuthCookie } from "@/lib/auth";
import { passwordChangeSchema, profileSchema } from "@/lib/validators";
import { fail, handleError, ok } from "@/lib/api";

/** Profil bilgilerini günceller. */
export async function PUT(request: NextRequest) {
  try {
    const current = await requireUser();
    const data = profileSchema.parse(await request.json());

    const user = await prisma.user.update({
      where: { id: current.id },
      data: {
        name: data.name,
        phone: data.phone || null,
        image: data.image || null,
      },
      select: { id: true, name: true, email: true, role: true, image: true, phone: true },
    });

    // İsim token içinde taşındığı için çerezi tazeliyoruz
    await setAuthCookie({ sub: user.id, email: user.email, role: user.role, name: user.name });

    return ok({ user });
  } catch (error) {
    return handleError(error);
  }
}

/** Şifre değiştirir. */
export async function PATCH(request: NextRequest) {
  try {
    const current = await requireUser();
    const data = passwordChangeSchema.parse(await request.json());

    const user = await prisma.user.findUnique({ where: { id: current.id } });
    if (!user) return fail("Kullanıcı bulunamadı", 404);

    const valid = await comparePassword(data.currentPassword, user.password);
    if (!valid) return fail("Mevcut şifre hatalı", 400, { currentPassword: "Mevcut şifre hatalı" });

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(data.newPassword) },
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
