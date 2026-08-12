import Link from "next/link";
import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-amz-border bg-white px-6 py-14 text-center">
      {icon && <div className="text-zinc-300">{icon}</div>}
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      {description && <p className="max-w-md text-sm text-zinc-600">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-amz mt-2">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
