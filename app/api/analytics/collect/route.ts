import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { AUTH_COOKIE, verifyToken } from "@/lib/jwt";
import { isBot, localDate, localHour, parseUserAgent, resolveSource } from "@/lib/analytics";
import { ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  path: z.string().min(1).max(300),
  url: z.string().max(600).optional().default(""),
  title: z.string().max(160).optional().default(""),
  referrer: z.string().max(600).optional().default(""),
  sessionId: z.string().max(64).optional().default(""),
  language: z.string().max(20).optional().default(""),
});

/** Yalnızca ilk IP'yi alır; proxy zincirinde istemci IP'si baştadır. */
function clientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "0.0.0.0";
}

/** Barındırıcının coğrafya başlıkları (Vercel, Cloudflare). Yoksa boş kalır. */
function geo(request: NextRequest) {
  const h = request.headers;
  const country =
    h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? h.get("x-country-code") ?? "";
  const rawCity = h.get("x-vercel-ip-city") ?? h.get("cf-ipcity") ?? "";
  let city = "";
  try {
    city = decodeURIComponent(rawCity);
  } catch {
    city = rawCity;
  }
  return { country: country.toUpperCase().slice(0, 2), city: city.slice(0, 60) };
}

/**
 * Ziyaretçiyi IP saklamadan tanımlar: IP + tarayıcı + gün + gizli anahtar
 * özetlenir. Tarih girdiye dahil olduğu için kimlik her gün değişir ve
 * özetten IP'ye geri dönülemez.
 */
function visitorHash(ip: string, ua: string, date: string) {
  return createHash("sha256")
    .update(`${ip}|${ua}|${date}|${process.env.JWT_SECRET ?? "amz"}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Sayfa görüntüleme toplayıcısı. Ziyaretçi deneyimini hiçbir koşulda
 * etkilememesi için her durumda 200 döner; hata olursa sessizce yutulur.
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return ok({ tracked: false });

    const { path, url, title, referrer, sessionId, language } = parsed.data;

    // Panel trafiği ve API çağrıları rapora girmez.
    if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) {
      return ok({ tracked: false });
    }

    const ua = request.headers.get("user-agent") ?? "";
    if (isBot(ua)) return ok({ tracked: false });

    // Yöneticinin kendi gezinmesi istatistiği bozmasın.
    const token = request.cookies.get(AUTH_COOKIE)?.value;
    const session = token ? await verifyToken(token) : null;
    if (session?.role === "ADMIN") return ok({ tracked: false });

    const now = new Date();
    const date = localDate(now);
    const { country, city } = geo(request);
    const { device, browser, os } = parseUserAgent(ua);
    const { source, medium, campaign } = resolveSource(
      referrer,
      url || `${request.nextUrl.origin}${path}`,
      request.nextUrl.hostname,
    );

    await prisma.pageView.create({
      data: {
        path: path.split("?")[0].slice(0, 300),
        title,
        visitorId: visitorHash(clientIp(request), ua, date),
        sessionId,
        userId: session?.sub ?? null,
        referrer: referrer.slice(0, 600),
        source,
        medium,
        campaign,
        country,
        city,
        device,
        browser,
        os,
        language: language.slice(0, 20),
        date,
        hour: localHour(now),
        createdAt: now,
      },
    });

    return ok({ tracked: true });
  } catch (error) {
    console.error("[analytics]", error);
    return ok({ tracked: false });
  }
}
