import type { TrafficDay } from "@/lib/analytics-queries";

/**
 * Eksende gösterilecek etiket indekslerini seçer (ilk ve son her zaman dahil).
 * Her sütuna etiket basmak dar ekranda satırı taşırdığı için seyrekleştirilir.
 */
function tickIndexes(count: number, max: number) {
  if (count <= max) return Array.from({ length: count }, (_, i) => i);
  const step = (count - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => Math.round(i * step));
}

/** Etiket satırı: uçlar kenarlara yaslanır, aradakiler eşit dağılır. */
function AxisLabels({ labels }: { labels: string[] }) {
  return (
    <div className="mt-1 flex justify-between gap-2 text-[10px] text-zinc-500">
      {labels.map((label, index) => (
        <span key={`${label}-${index}`} className="whitespace-nowrap">
          {label}
        </span>
      ))}
    </div>
  );
}

/**
 * Günlük ziyaretçi/görüntüleme sütunları. Her gün için iki ince çubuk çizilir;
 * `RevenueChart` gibi bağımlılıksızdır ve tamamen sunucuda render edilir.
 */
export function TrafficChart({ days, height = 220 }: { days: TrafficDay[]; height?: number }) {
  const max = Math.max(...days.map((day) => Math.max(day.views, day.visitors)), 1);
  // Dar ekranda 5 etiket sığar; gün sayısı azsa hepsi gösterilir.
  const labels = tickIndexes(days.length, 5).map((index) =>
    days.length > 7 ? days[index].date.slice(5) : days[index].date.slice(8),
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-amz-orange" /> Sayfa görüntüleme
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-indigo-500" /> Tekil ziyaretçi
        </span>
        <span className="text-zinc-400">Zirve: {max}</span>
      </div>

      <div className="flex items-end gap-px sm:gap-1" style={{ height }}>
        {days.map((day) => (
          <div
            key={day.date}
            className="group flex h-full flex-1 items-end justify-center gap-px"
            title={`${day.date} · ${day.views} görüntüleme · ${day.visitors} ziyaretçi`}
          >
            <div
              className="w-1/2 rounded-t bg-amz-orange/80 transition group-hover:bg-amz-orange"
              style={{ height: `${Math.max(day.views > 0 ? 2 : 0.5, (day.views / max) * 100)}%` }}
            />
            <div
              className="w-1/2 rounded-t bg-indigo-500/70 transition group-hover:bg-indigo-500"
              style={{
                height: `${Math.max(day.visitors > 0 ? 2 : 0.5, (day.visitors / max) * 100)}%`,
              }}
            />
          </div>
        ))}
      </div>

      <AxisLabels labels={labels} />
    </div>
  );
}

/** Günün hangi saatlerinde trafik olduğunu gösteren 24 kovalı dağılım. */
export function HourChart({
  hours,
  height = 140,
}: {
  hours: { hour: number; views: number }[];
  height?: number;
}) {
  const max = Math.max(...hours.map((h) => h.views), 1);

  return (
    <div>
      <div className="flex items-end gap-0.5 sm:gap-1" style={{ height }}>
        {hours.map((slot) => (
          <div
            key={slot.hour}
            className="group flex h-full flex-1 flex-col justify-end"
            title={`${String(slot.hour).padStart(2, "0")}:00 – ${String(slot.hour).padStart(2, "0")}:59 · ${slot.views} görüntüleme`}
          >
            <div
              className="w-full rounded-t bg-sky-500/70 transition group-hover:bg-sky-500"
              style={{ height: `${Math.max(slot.views > 0 ? 2 : 0.5, (slot.views / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>

      <AxisLabels
        labels={tickIndexes(hours.length, 6).map(
          (index) => `${String(hours[index].hour).padStart(2, "0")}:00`,
        )}
      />
    </div>
  );
}
