import type { TrafficDay } from "@/lib/analytics-queries";

/**
 * Günlük ziyaretçi/görüntüleme sütunları. Her gün için iki ince çubuk çizilir;
 * `RevenueChart` gibi bağımlılıksızdır ve tamamen sunucuda render edilir.
 */
export function TrafficChart({ days, height = 220 }: { days: TrafficDay[]; height?: number }) {
  const max = Math.max(...days.map((day) => Math.max(day.views, day.visitors)), 1);
  const compact = days.length > 40;

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

      <div className="mt-1 flex gap-px text-[10px] text-zinc-500 sm:gap-1">
        {days.map((day, index) => (
          <span key={day.date} className="flex-1 text-center">
            {compact ? (index % 7 === 0 ? day.date.slice(5) : "") : day.date.slice(8)}
          </span>
        ))}
      </div>
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

      <div className="mt-1 flex gap-0.5 text-[10px] text-zinc-500 sm:gap-1">
        {hours.map((slot) => (
          <span key={slot.hour} className="flex-1 text-center">
            {slot.hour % 3 === 0 ? String(slot.hour).padStart(2, "0") : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
