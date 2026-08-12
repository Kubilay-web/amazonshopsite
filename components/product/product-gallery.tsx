"use client";

import { useState } from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const list = images.length > 0 ? images : [""];
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {/* Küçük görseller */}
      <div className="scrollbar-hide flex gap-2 overflow-x-auto sm:max-h-[520px] sm:w-16 sm:flex-col sm:overflow-y-auto">
        {list.map((image, i) => (
          <button
            key={`${image}-${i}`}
            type="button"
            onMouseEnter={() => setActive(i)}
            onClick={() => setActive(i)}
            aria-label={`${i + 1}. görsel`}
            className={cn(
              "relative size-14 shrink-0 overflow-hidden rounded border bg-white p-1 sm:size-16",
              active === i ? "border-amz-orange ring-1 ring-amz-orange" : "border-amz-border",
            )}
          >
            <SafeImage src={image} alt="" fill sizes="64px" className="object-contain" />
          </button>
        ))}
      </div>

      {/* Ana görsel */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white sm:flex-1">
        <SafeImage
          src={list[active]}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 40vw"
          className="object-contain p-4"
        />
      </div>
    </div>
  );
}
