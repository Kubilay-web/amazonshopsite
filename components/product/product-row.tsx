"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { ProductCardData } from "@/types";

/** Yatay kaydırmalı ürün rayı — mobilde parmakla, masaüstünde oklarla. */
export function ProductRow({
  title,
  products,
  href,
}: {
  title: string;
  products: ProductCardData[];
  href?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  function scroll(direction: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
  }

  return (
    <section className="rounded-lg bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-zinc-900 sm:text-xl">{title}</h2>
        <div className="flex items-center gap-2">
          {href && (
            <Link href={href} className="text-sm text-amz-link hover:text-amz-link-hover">
              Tümünü gör
            </Link>
          )}
          <div className="hidden gap-1 sm:flex">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Geri kaydır"
              className="rounded-full border border-amz-border p-1.5 hover:bg-amz-light"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="İleri kaydır"
              className="rounded-full border border-amz-border p-1.5 hover:bg-amz-light"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scroller}
        className="snap-row scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-1"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[46%] shrink-0 sm:w-[32%] md:w-[24%] lg:w-[19%] xl:w-[15.5%]"
          >
            <ProductCard product={product} compact />
          </div>
        ))}
      </div>
    </section>
  );
}
