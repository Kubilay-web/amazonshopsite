"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Link2, Trash2, Upload } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";

/**
 * Cloudinary'ye görsel yükler. Cloudinary yapılandırılmamışsa
 * doğrudan URL yapıştırma seçeneği her zaman kullanılabilir.
 */
export function ImageUploader({
  images,
  onChange,
  folder = "amazon-clone/products",
  max = 8,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  folder?: string;
  max?: number;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState("");

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (images.length + files.length > max) {
      toast(`En fazla ${max} görsel ekleyebilirsiniz`, "error");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      Array.from(files).forEach((file) => form.append("files", file));
      form.append("folder", folder);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Yükleme başarısız");

      onChange([...images, ...data.images.map((i: { url: string }) => i.url)]);
      toast(`${data.images.length} görsel yüklendi`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Yükleme başarısız", "error");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function addUrl() {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (images.length >= max) {
      toast(`En fazla ${max} görsel ekleyebilirsiniz`, "error");
      return;
    }
    onChange([...images, trimmed]);
    setUrl("");
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || images.length >= max}
          className="btn-amz-outline"
        >
          {uploading ? <Spinner /> : <Upload className="size-4" />}
          Cloudinary&apos;ye yükle
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => upload(e.target.files)}
        />

        <div className="flex min-w-60 flex-1 gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder="veya görsel URL'si yapıştırın"
            className="input-amz"
          />
          <button type="button" onClick={addUrl} className="btn-amz-outline shrink-0">
            <Link2 className="size-4" /> Ekle
          </button>
        </div>
      </div>

      {images.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {images.map((image, index) => (
            <li
              key={`${image}-${index}`}
              className="group relative aspect-square overflow-hidden rounded border border-zinc-200 bg-white"
            >
              <SafeImage
                src={image}
                alt={`Görsel ${index + 1}`}
                fill
                sizes="150px"
                className="object-contain p-1"
              />
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-amz-orange px-1.5 py-0.5 text-[10px] font-bold text-zinc-900">
                  Kapak
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/60 p-1 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  className="text-white disabled:opacity-30"
                  disabled={index === 0}
                  aria-label="Sola taşı"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, i) => i !== index))}
                  className="text-rose-300 hover:text-rose-100"
                  aria-label="Sil"
                >
                  <Trash2 className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  className="text-white disabled:opacity-30"
                  disabled={index === images.length - 1}
                  aria-label="Sağa taşı"
                >
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500">
          Henüz görsel eklenmedi. İlk görsel kapak olarak kullanılır.
        </p>
      )}
    </div>
  );
}
