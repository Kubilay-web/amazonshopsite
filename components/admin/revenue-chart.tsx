import { formatPrice } from "@/lib/utils";

export type ChartDay = { date: string; revenue: number; orders: number };

/**
 * Bağımlılık gerektirmeyen sütun grafik. Değerler sunucuda hesaplanır;
 * bileşen tamamen statik HTML üretir.
 */
export function RevenueChart({ days, height = 200 }: { days: ChartDay[]; height?: number }) {
  const max = Math.max(...days.map((d) => d.revenue), 1);
  const total = days.reduce((s, d) => s + d.revenue, 0);
  const orders = days.reduce((s, d) => s + d.orders, 0);
  const compact = days.length > 40;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
        <span className="font-semibold text-zinc-900">{formatPrice(total)}</span>
        <span className="text-zinc-500">{orders} ödenmiş sipariş</span>
        <span className="text-zinc-500">
          Zirve: {formatPrice(max)}
        </span>
      </div>

      <div className="flex items-end gap-px sm:gap-1" style={{ height }}>
        {days.map((day) => (
          <div
            key={day.date}
            className="group relative flex h-full flex-1 flex-col justify-end"
            title={`${day.date} · ${formatPrice(day.revenue)} · ${day.orders} sipariş`}
          >
            <div
              className="w-full rounded-t bg-amz-orange/80 transition group-hover:bg-amz-orange"
              style={{ height: `${Math.max(1.5, (day.revenue / max) * 100)}%` }}
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
