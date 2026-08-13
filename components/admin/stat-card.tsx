import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatTone = "emerald" | "blue" | "indigo" | "amber" | "violet" | "orange" | "rose" | "zinc";

const TONES: Record<StatTone, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  blue: "bg-blue-50 text-blue-700",
  indigo: "bg-indigo-50 text-indigo-700",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
  orange: "bg-orange-50 text-orange-700",
  rose: "bg-rose-50 text-rose-700",
  zinc: "bg-zinc-100 text-zinc-700",
};

/** Panodaki tek metrik kutusu. `href` verilirse tıklanabilir olur. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "zinc",
  href,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: StatTone;
  href?: string;
  trend?: number | null;
}) {
  const body = (
    <>
      <div className="mb-2 flex items-start justify-between">
        <span className={cn("inline-flex rounded-lg p-2", TONES[tone])}>
          <Icon className="size-5" />
        </span>
        {trend != null && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              trend >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
            )}
          >
            {trend >= 0 ? "▲" : "▼"} %{Math.abs(trend).toFixed(1)}
          </span>
        )}
      </div>
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="text-xl font-bold text-zinc-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
    </>
  );

  const className = cn(
    "block rounded-lg border border-zinc-200 bg-white p-4",
    href && "transition hover:border-amz-orange hover:shadow-sm",
  );

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
