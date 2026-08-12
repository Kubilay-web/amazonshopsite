import { cn } from "@/lib/utils";
import { finalPrice, formatPrice } from "@/lib/utils";

export function Price({
  price,
  discountPercent = 0,
  size = "md",
  className,
  showOld = true,
}: {
  price: number;
  discountPercent?: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showOld?: boolean;
}) {
  const value = finalPrice(price, discountPercent);
  const sizes = {
    sm: "text-sm",
    md: "text-base sm:text-lg",
    lg: "text-xl sm:text-2xl",
    xl: "text-2xl sm:text-3xl",
  };

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn("font-semibold text-amz-price", sizes[size])}>
        {formatPrice(value)}
      </span>
      {showOld && discountPercent > 0 && (
        <>
          <span className="text-xs text-zinc-500 line-through sm:text-sm">
            {formatPrice(price)}
          </span>
          <span className="rounded bg-amz-price px-1.5 py-0.5 text-[11px] font-semibold text-white">
            %{discountPercent}
          </span>
        </>
      )}
    </div>
  );
}
