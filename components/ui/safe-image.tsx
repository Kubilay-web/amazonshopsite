"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const FALLBACK =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="#f3f4f6"/>
      <path d="M120 250l50-60 40 45 30-35 40 50z" fill="#d1d5db"/>
      <circle cx="160" cy="150" r="22" fill="#d1d5db"/>
      <text x="200" y="330" font-family="Arial" font-size="18" fill="#9ca3af" text-anchor="middle">Görsel yok</text>
    </svg>`,
  );

/** next/image sarmalayıcı: kırık veya boş görselleri yer tutucuya düşürür. */
export function SafeImage({
  src,
  alt,
  ...props
}: Omit<ImageProps, "src"> & { src?: string | null }) {
  const [failed, setFailed] = useState(false);
  const resolved = !src || failed ? FALLBACK : src;
  // SVG ve data URI'ler optimize edilmez (Next varsayılan olarak SVG'yi işlemez)
  const skipOptimize = resolved.startsWith("data:") || resolved.endsWith(".svg");

  return (
    <Image
      {...props}
      src={resolved}
      alt={alt}
      unoptimized={skipOptimize || props.unoptimized}
      onError={() => setFailed(true)}
    />
  );
}
