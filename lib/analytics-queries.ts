import "server-only";
import prisma from "@/lib/prisma";
import { dateKeys, localDate } from "@/lib/analytics";

const DAY = 24 * 60 * 60 * 1000;

export type TrafficRangeKey = "1" | "7" | "30" | "90";

export const TRAFFIC_RANGE_LABELS: Record<TrafficRangeKey, string> = {
  "1": "Bugün",
  "7": "Son 7 gün",
  "30": "Son 30 gün",
  "90": "Son 90 gün",
};

export function parseTrafficRange(value: unknown): TrafficRangeKey {
  return value === "1" || value === "7" || value === "90" ? value : "30";
}

export type TrafficDay = { date: string; views: number; visitors: number };
export type BreakdownRow = { key: string; label: string; count: number };

/** groupBy sonucunu {key,label,count} listesine indirger ve büyükten küçüğe sıralar. */
function toRows(
  rows: unknown[],
  field: string,
  label: (value: string) => string = (value) => value,
  limit = 10,
): BreakdownRow[] {
  return (rows as (Record<string, unknown> & { _count: { _all: number } })[])
    .map((row) => {
      const value = String(row[field] ?? "");
      return { key: value, label: label(value), count: row._count._all };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Yönetim panelindeki ziyaretçi raporu. Tüm gruplamalar veritabanında yapılır;
 * `date` alanı Türkiye saatine göre önceden hesaplandığı için aralık filtresi
 * basit bir metin karşılaştırmasıdır.
 */
export async function getTrafficReport(range: TrafficRangeKey) {
  const days = Number(range);
  const now = new Date();
  const keys = dateKeys(days, now);
  const since = keys[0];

  // Önceki eşit uzunluktaki dönem (değişim yüzdesi için)
  const prevEnd = new Date(now.getTime() - days * DAY);
  const prevKeys = dateKeys(days, prevEnd);
  const prevSince = prevKeys[0];
  const prevUntil = prevKeys[prevKeys.length - 1];

  const where = { date: { gte: since } };
  const prevWhere = { date: { gte: prevSince, lte: prevUntil } };

  const [
    views,
    visitorRows,
    sessionRows,
    dailyViews,
    dailyVisitorRows,
    hourRows,
    countryRows,
    sourceRows,
    mediumRows,
    pathRows,
    deviceRows,
    browserRows,
    memberViews,
    liveVisitorRows,
    prevViews,
    prevVisitorRows,
  ] = await Promise.all([
    prisma.pageView.count({ where }),
    prisma.pageView.groupBy({ by: ["visitorId"], where }),
    prisma.pageView.groupBy({ by: ["sessionId"], where: { ...where, sessionId: { not: "" } } }),
    prisma.pageView.groupBy({ by: ["date"], where, _count: { _all: true } }),
    prisma.pageView.groupBy({ by: ["date", "visitorId"], where }),
    prisma.pageView.groupBy({ by: ["hour"], where, _count: { _all: true } }),
    prisma.pageView.groupBy({ by: ["country"], where, _count: { _all: true } }),
    prisma.pageView.groupBy({
      by: ["source"],
      where: { ...where, medium: { not: "internal" } },
      _count: { _all: true },
    }),
    prisma.pageView.groupBy({
      by: ["medium"],
      where: { ...where, medium: { not: "internal" } },
      _count: { _all: true },
    }),
    prisma.pageView.groupBy({ by: ["path"], where, _count: { _all: true } }),
    prisma.pageView.groupBy({ by: ["device"], where, _count: { _all: true } }),
    prisma.pageView.groupBy({ by: ["browser"], where, _count: { _all: true } }),
    prisma.pageView.count({ where: { ...where, userId: { not: null } } }),
    prisma.pageView.groupBy({
      by: ["visitorId"],
      where: { createdAt: { gte: new Date(now.getTime() - 30 * 60 * 1000) } },
    }),
    prisma.pageView.count({ where: prevWhere }),
    prisma.pageView.groupBy({ by: ["visitorId"], where: prevWhere }),
  ]);

  const visitors = visitorRows.length;
  const prevVisitors = prevVisitorRows.length;

  // Günlük seri — boş günler sıfırla doldurulur.
  const viewsByDate = new Map(dailyViews.map((row) => [row.date, row._count._all]));
  const visitorsByDate = new Map<string, number>();
  for (const row of dailyVisitorRows) {
    visitorsByDate.set(row.date, (visitorsByDate.get(row.date) ?? 0) + 1);
  }
  const series: TrafficDay[] = keys.map((date) => ({
    date,
    views: viewsByDate.get(date) ?? 0,
    visitors: visitorsByDate.get(date) ?? 0,
  }));

  // Saat dağılımı — 24 kova, veri olmayan saatler sıfır.
  const hourCounts = new Map(hourRows.map((row) => [row.hour, row._count._all]));
  const hours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    views: hourCounts.get(hour) ?? 0,
  }));
  const peakHour = hours.reduce((best, current) => (current.views > best.views ? current : best), hours[0]);

  const trend = (current: number, previous: number) =>
    previous > 0 ? ((current - previous) / previous) * 100 : null;

  return {
    range,
    since,
    views,
    visitors,
    sessions: sessionRows.length,
    viewsPerVisitor: visitors > 0 ? views / visitors : 0,
    memberShare: views > 0 ? Math.round((memberViews / views) * 100) : 0,
    liveVisitors: liveVisitorRows.length,
    peakHour,
    series,
    hours,
    countries: toRows(countryRows, "country", undefined, 12),
    sources: toRows(sourceRows, "source", undefined, 10),
    mediums: toRows(mediumRows, "medium", undefined, 6),
    pages: toRows(pathRows, "path", undefined, 12),
    devices: toRows(deviceRows, "device", undefined, 3),
    browsers: toRows(browserRows, "browser", undefined, 6),
    viewsTrend: trend(views, prevViews),
    visitorsTrend: trend(visitors, prevVisitors),
  };
}

export type TrafficReport = Awaited<ReturnType<typeof getTrafficReport>>;

/** Panodaki özet kutusu için bugünün rakamları. */
export async function getTodayTraffic() {
  const today = localDate();
  const [views, visitorRows] = await Promise.all([
    prisma.pageView.count({ where: { date: today } }),
    prisma.pageView.groupBy({ by: ["visitorId"], where: { date: today } }),
  ]);
  return { views, visitors: visitorRows.length };
}
