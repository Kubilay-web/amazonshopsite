"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";

export function CartButton({ compact = false }: { compact?: boolean }) {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-1 rounded-sm border border-transparent px-2 py-1.5 text-white hover:border-white"
      aria-label={`Sepet, ${count} ürün`}
    >
      <span className="relative">
        <ShoppingCart className="size-6 sm:size-7" />
        <span className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-amz-orange px-1 text-center text-[11px] font-bold leading-4 text-zinc-900">
          {count > 99 ? "99+" : count}
        </span>
      </span>
      {!compact && <span className="hidden text-sm font-bold lg:inline">Sepet</span>}
    </Link>
  );
}
