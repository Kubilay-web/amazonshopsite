import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, setAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { fail, handleError, ok } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return fail("E-posta veya şifre hatalı", 401);
    if (user.blocked) return fail("Hesabınız askıya alınmış", 403);

    const valid = await comparePassword(data.password, user.password);
    if (!valid) return fail("E-posta veya şifre hatalı", 401);

    await setAuthCookie({ sub: user.id, email: user.email, role: user.role, name: user.name });

    return ok({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
