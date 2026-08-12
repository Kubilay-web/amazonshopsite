"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Spinner } from "@/components/ui/spinner";
import { DeleteButton } from "@/components/admin/delete-button";
import { ImageUploader } from "@/components/admin/image-uploader";
import { useToast } from "@/components/providers/toast-provider";

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string;
  position: "HERO" | "STRIP";
  order: number;
  active: boolean;
};

const EMPTY = {
  title: "",
  subtitle: "",
  image: "",
  link: "/",
  position: "HERO" as "HERO" | "STRIP",
  order: 0,
  active: true,
};

export function BannerManager({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [modal, setModal] = useState<(typeof EMPTY & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!modal) return;
    if (!modal.image) {
      toast("Görsel ekleyin", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(modal.id ? `/api/banners/${modal.id}` : "/api/banners", {
        method: modal.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modal),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Kaydedilemedi");
      toast(modal.id ? "Banner güncellendi" : "Banner oluşturuldu");
      setModal(null);
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => setModal({ ...EMPTY })} className="btn-amz">
        <Plus className="size-4" /> Yeni banner
      </button>

      {banners.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500">
          Henüz banner yok. Ana sayfada varsayılan görseller gösteriliyor.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="overflow-hidden rounded-lg border border-zinc-200 bg-white"
            >
              <div className="relative h-32 w-full bg-zinc-100">
                <SafeImage
                  src={banner.image}
                  alt={banner.title}
                  fill
                  sizes="400px"
                  className="object-cover"
                />
                <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">
                  {banner.position === "HERO" ? "Ana slayt" : "Şerit"}
                </span>
                {!banner.active && (
                  <span className="absolute right-2 top-2 rounded bg-rose-600 px-2 py-0.5 text-[11px] text-white">
                    Pasif
                  </span>
                )}
              </div>

              <div className="space-y-1 p-3">
                <h3 className="font-bold text-zinc-900">{banner.title}</h3>
                {banner.subtitle && (
                  <p className="line-clamp-2 text-sm text-zinc-600">{banner.subtitle}</p>
                )}
                <p className="truncate text-xs text-zinc-500">→ {banner.link}</p>
                <p className="text-xs text-zinc-500">Sıra: {banner.order}</p>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setModal({
                        id: banner.id,
                        title: banner.title,
                        subtitle: banner.subtitle ?? "",
                        image: banner.image,
                        link: banner.link,
                        position: banner.position,
                        order: banner.order,
                        active: banner.active,
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs text-amz-link hover:text-amz-link-hover"
                  >
                    <Pencil className="size-3.5" /> Düzenle
                  </button>
                  <DeleteButton endpoint={`/api/banners/${banner.id}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-90 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
          <div className="animate-fade-in max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">
                {modal.id ? "Bannerı düzenle" : "Yeni banner"}
              </h2>
              <button type="button" onClick={() => setModal(null)} aria-label="Kapat">
                <X className="size-5 text-zinc-500" />
              </button>
            </div>

            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Başlık *</label>
                <input
                  required
                  value={modal.title}
                  onChange={(e) => setModal({ ...modal, title: e.target.value })}
                  className="input-amz"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Alt başlık</label>
                <input
                  value={modal.subtitle}
                  onChange={(e) => setModal({ ...modal, subtitle: e.target.value })}
                  className="input-amz"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Görsel *</label>
                <ImageUploader
                  images={modal.image ? [modal.image] : []}
                  onChange={(images) => setModal({ ...modal, image: images[0] ?? "" })}
                  folder="amazon-clone/banners"
                  max={1}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Yönlendirme bağlantısı
                </label>
                <input
                  value={modal.link}
                  onChange={(e) => setModal({ ...modal, link: e.target.value })}
                  className="input-amz"
                  placeholder="/category/elektronik"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Konum</label>
                  <select
                    value={modal.position}
                    onChange={(e) =>
                      setModal({ ...modal, position: e.target.value as "HERO" | "STRIP" })
                    }
                    className="input-amz"
                  >
                    <option value="HERO">Ana slayt</option>
                    <option value="STRIP">Orta şerit</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Sıra</label>
                  <input
                    type="number"
                    min={0}
                    value={modal.order}
                    onChange={(e) => setModal({ ...modal, order: Number(e.target.value) })}
                    className="input-amz"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={modal.active}
                  onChange={(e) => setModal({ ...modal, active: e.target.checked })}
                  className="size-4 accent-amz-orange"
                />
                Yayında
              </label>

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="btn-amz flex-1">
                  {saving && <Spinner />} Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="btn-amz-outline flex-1"
                >
                  Vazgeç
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
