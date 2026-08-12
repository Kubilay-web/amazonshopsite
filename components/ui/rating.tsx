import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  size = "sm",
  showCount = true,
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}) {
  const sizes = { sm: "size-3.5", md: "size-4", lg: "size-5" };
  const rounded = Math.round(value * 2) / 2;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center" aria-label={`${value.toFixed(1)} / 5 puan`}>
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = rounded >= i;
          const half = !filled && rounded >= i - 0.5;
          return (
            <span key={i} className="relative inline-flex">
              <Star className={cn(sizes[size], "text-amz-star/40")} strokeWidth={1.5} />
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: filled ? "100%" : "50%" }}
                >
                  <Star
                    className={cn(sizes[size], "fill-amz-star text-amz-star")}
                    strokeWidth={1.5}
                  />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {showCount && count != null && (
        <span className="text-xs text-amz-link">({count})</span>
      )}
    </div>
  );
}
