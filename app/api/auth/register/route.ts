import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, setAuthCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";
import { fail, handleError, ok } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return fail("Bu e-posta zaten kayıtlı", 409, { email: "Bu e-posta zaten kayıtlı" });

    // İlk kullanıcı otomatik olarak yönetici olur
    const userCount = await prisma.user.count();

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: await hashPassword(data.password),
        role: userCount === 0 ? "ADMIN" : "USER",
      },
      select: { id: true, name: true, email: true, role: true, image: true },
    });

    await setAuthCookie({ sub: user.id, email: user.email, role: user.role, name: user.name });
    return ok({ user }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
