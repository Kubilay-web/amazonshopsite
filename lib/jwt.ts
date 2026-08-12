import { SignJWT, jwtVerify } from "jose";

export const AUTH_COOKIE = "amz_token";

export type JwtPayload = {
  sub: string;
  email: string;
  role: "USER" | "ADMIN";
  name: string;
};

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET tanımlı değil (.env dosyasına ekleyin)");
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: JwtPayload, expiresIn = "7d") {
  return new SignJWT({ email: payload.email, role: payload.role, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      role: (payload.role as "USER" | "ADMIN") ?? "USER",
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}
