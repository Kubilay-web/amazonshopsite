import type { ReactNode } from "react";
import type { BreakdownRow } from "@/lib/analytics-queries";

/**
 * Ülke / kaynak / sayfa gibi kırılımlar için ortak liste kartı.
 * Her satırda oransal bir çubuk ve toplam içindeki yüzde gösterilir.
 */
export function Breakdown({
  title,
  rows,
  total,
  tone = "bg-amz-orange",
  empty = "Bu aralıkta veri yok.",
  renderLabel,
}: {
  title: string;
  rows: BreakdownRow[];
  total: number;
  tone?: string;
  empty?: string;
  renderLabel?: (row: BreakdownRow) => ReactNode;
}) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  const base = total > 0 ? total : 1;

  // min-w-0: ızgara hücresinin varsayılan `min-width: auto` tabanı, içerideki
  // uzun sayfa yollarını taban alır ve sütunu dar ekranda viewport'tan taşırır.
  return (
    <section className="min-w-0 rounded-lg border border-zinc-200 bg-white">
      <h2 className="border-b border-zinc-200 p-4 text-lg font-bold text-zinc-900">{title}</h2>
      {rows.length === 0 ? (
        <p className="p-5 text-sm text-zinc-500">{empty}</p>
      ) : (
        <ul className="space-y-3 p-4">
          {rows.map((row) => (
            <li key={row.key}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                {/* min-w-0 + truncate olmadan uzun ülke adları / ürün yolları
                    hücreyi büyütür ve kart dar ekranda taşar. */}
                <div className="min-w-0 flex-1 truncate text-zinc-800">
                  {renderLabel ? renderLabel(row) : (row.label || "Bilinmiyor")}
                </div>
                <span className="shrink-0 whitespace-nowrap font-semibold text-zinc-900">
                  {row.count}
                  <span className="ml-2 text-xs font-normal text-zinc-500">
                    %{Math.round((row.count / base) * 100)}
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={`h-full rounded-full ${tone}`}
                  style={{ width: `${Math.max(2, (row.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
