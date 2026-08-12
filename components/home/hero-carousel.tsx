"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";

export type Slide = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string;
};

export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const total = slides.length;

  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);

  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, total]);

  if (total === 0) return null;

  return (
    <section className="relative">
      <div className="relative h-[220px] w-full overflow-hidden sm:h-[320px] lg:h-[420px]">
        {slides.map((slide, i) => (
          <Link
            key={slide.id}
            href={slide.link || "/"}
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              i === index ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <SafeImage
              src={slide.image}
              alt={slide.title}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-amz-light via-amz-light/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-8 mx-auto max-w-[1500px] px-5 sm:bottom-14 sm:px-8">
              <div className="max-w-md rounded-lg bg-white/85 p-4 shadow-lg backdrop-blur-sm sm:p-5">
                <h2 className="text-lg font-bold text-zinc-900 sm:text-2xl">{slide.title}</h2>
                {slide.subtitle && (
                  <p className="mt-1 text-sm text-zinc-700 sm:text-base">{slide.subtitle}</p>
                )}
                <span className="btn-amz mt-3">Keşfet</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Önceki"
            className="absolute left-1 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white sm:block"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Sonraki"
            className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white sm:block"
          >
            <ChevronRight className="size-6" />
          </button>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}. slayt`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-6 bg-amz-orange" : "w-1.5 bg-zinc-400",
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
