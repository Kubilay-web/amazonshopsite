import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { AUTH_COOKIE, signToken, verifyToken, type JwtPayload } from "@/lib/jwt";

export { AUTH_COOKIE, signToken, verifyToken };
export type { JwtPayload };

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** Giriş çerezini yazar (httpOnly). */
export async function setAuthCookie(payload: JwtPayload) {
  const token = await signToken(payload);
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return token;
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.set(AUTH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  image: string | null;
};

/**
 * Aktif oturumdaki kullanıcıyı döner. React `cache` sayesinde aynı istek
 * içinde birden çok çağrılsa da veritabanına tek sorgu gider.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, role: true, image: true, blocked: true },
  });

  if (!user || user.blocked) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    image: user.image,
  };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
