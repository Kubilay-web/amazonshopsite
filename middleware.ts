import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/jwt";

const PROTECTED = ["/account", "/checkout", "/wishlist"];
const ADMIN_ONLY = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const needsAuth = PROTECTED.some((p) => pathname.startsWith(p));
  const needsAdmin = ADMIN_ONLY.some((p) => pathname.startsWith(p));
  if (!needsAuth && !needsAdmin) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (needsAdmin && payload.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*", "/wishlist/:path*", "/admin/:path*"],
};
