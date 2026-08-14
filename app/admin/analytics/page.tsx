import Link from "next/link";
import {
  Clock,
  Eye,
  Globe2,
  Layers,
  MonitorSmartphone,
  Radio,
  UserRound,
  Users,
} from "lucide-react";
import {
  TRAFFIC_RANGE_LABELS,
  getTrafficReport,
  parseTrafficRange,
  type TrafficRangeKey,
} from "@/lib/analytics-queries";
import { DEVICE_LABELS, MEDIUM_LABELS, countryFlag, countryName } from "@/lib/analytics";
import { StatCard } from "@/components/admin/stat-card";
import { Breakdown } from "@/components/admin/breakdown";
import { HourChart, TrafficChart } from "@/components/admin/traffic-chart";

export const dynamic = "force-dynamic";

const RANGES: TrafficRangeKey[] = ["1", "7", "30", "90"];

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const range = parseTrafficRange(sp.range);
  const report = await getTrafficReport(range);

  const peak = `${String(report.peakHour.hour).padStart(2, "0")}:00`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Ziyaretçi analizi</h1>
          <p className="text-sm text-zinc-600">
            {TRAFFIC_RANGE_LABELS[range]} · saatler Türkiye saatine göre
          </p>
        </div>

        <div className="flex gap-2">
          {RANGES.map((key) => (
            <Link
              key={key}
              href={`/admin/analytics?range=${key}`}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                key === range
                  ? "border-amz-orange bg-amz-orange font-medium"
                  : "border-zinc-300 bg-white hover:bg-zinc-50"
              }`}
            >
              {TRAFFIC_RANGE_LABELS[key]}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Tekil ziyaretçi"
          value={String(report.visitors)}
          hint="günlük anonim kimliğe göre"
          icon={Users}
          tone="indigo"
          trend={report.visitorsTrend}
        />
        <StatCard
          label="Sayfa görüntüleme"
          value={String(report.views)}
          icon={Eye}
          tone="orange"
          trend={report.viewsTrend}
        />
        <StatCard
          label="Şu an sitede"
          value={String(report.liveVisitors)}
          hint="son 30 dakika"
          icon={Radio}
          tone="emerald"
        />
        <StatCard
          label="Oturum"
          value={String(report.sessions)}
          icon={Layers}
          tone="blue"
        />
        <StatCard
          label="Ziyaretçi başına sayfa"
          value={report.viewsPerVisitor.toFixed(1)}
          icon={MonitorSmartphone}
          tone="violet"
        />
        <StatCard
          label="En yoğun saat"
          value={peak}
          hint={`${report.peakHour.views} görüntüleme`}
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label="Üye trafiği"
          value={`%${report.memberShare}`}
          hint="giriş yapmış kullanıcılar"
          icon={UserRound}
          tone="rose"
        />
        <StatCard
          label="Ülke sayısı"
          value={String(report.countries.filter((row) => row.key).length)}
          icon={Globe2}
          tone="zinc"
        />
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-bold text-zinc-900">Günlük trafik</h2>
        <TrafficChart days={report.series} height={220} />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-1 text-lg font-bold text-zinc-900">Saat dağılımı</h2>
        <p className="mb-3 text-sm text-zinc-600">
          Ziyaretçiler günün hangi saatlerinde geliyor? En yoğun saat: <strong>{peak}</strong>
        </p>
        <HourChart hours={report.hours} height={140} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Breakdown
          title="Ülkeler"
          rows={report.countries}
          total={report.views}
          tone="bg-emerald-400"
          empty="Ülke bilgisi yok. Yerelde çalışırken barındırıcı coğrafya başlığı göndermez; Vercel'de otomatik dolar."
          renderLabel={(row) => (
            <span className="flex items-center gap-2">
              <span aria-hidden>{countryFlag(row.key)}</span>
              {countryName(row.key)}
            </span>
          )}
        />

        <Breakdown
          title="Trafik kaynakları"
          rows={report.sources}
          total={report.views}
          tone="bg-amz-orange"
          renderLabel={(row) => (row.key === "direct" ? "Doğrudan giriş" : row.label)}
        />

        <Breakdown
          title="Kanal türü"
          rows={report.mediums}
          total={report.views}
          tone="bg-violet-400"
          renderLabel={(row) => MEDIUM_LABELS[row.key] ?? row.label}
        />

        <Breakdown
          title="En çok görüntülenen sayfalar"
          rows={report.pages}
          total={report.views}
          tone="bg-indigo-400"
        />

        <Breakdown
          title="Cihazlar"
          rows={report.devices}
          total={report.views}
          tone="bg-sky-400"
          renderLabel={(row) => DEVICE_LABELS[row.key] ?? row.label}
        />

        <Breakdown
          title="Tarayıcılar"
          rows={report.browsers}
          total={report.views}
          tone="bg-rose-400"
        />
      </div>

      <p className="text-xs text-zinc-500">
        Kayıtlar anonimdir: IP adresi saklanmaz, ziyaretçi kimliği her gün yenilenen tek yönlü bir
        özettir. Yönetim paneli gezintisi ve bilinen botlar rapora dahil edilmez.
      </p>
    </div>
  );
}
