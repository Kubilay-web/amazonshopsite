"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Spinner } from "@/components/ui/spinner";
import { DeleteButton } from "@/components/admin/delete-button";
import { ImageUploader } from "@/components/admin/image-uploader";
import { useToast } from "@/components/providers/toast-provider";

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  order: number;
  _count: { products: number };
  subCategories: {
    id: string;
    name: string;
    slug: string;
    _count: { products: number };
  }[];
};

export function CategoryManager({ categories }: { categories: CategoryNode[] }) {
  const router = useRouter();
  const { toast } = useToast();

  const [modal, setModal] = useState<
    | { type: "category"; id?: string; name: string; slug: string; image: string; order: number }
    | { type: "sub"; id?: string; name: string; slug: string; categoryId: string }
    | null
  >(null);
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!modal) return;
    setSaving(true);

    try {
      const isCategory = modal.type === "category";
      const base = isCategory ? "/api/categories" : "/api/subcategories";
      const res = await fetch(modal.id ? `${base}/${modal.id}` : base, {
        method: modal.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isCategory
            ? {
                name: modal.name,
                slug: modal.slug,
                image: modal.image,
                order: modal.order,
              }
            : { name: modal.name, slug: modal.slug, categoryId: modal.categoryId },
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Kaydedilemedi");

      toast(modal.id ? "Güncellendi" : "Oluşturuldu");
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
      <button
        type="button"
        onClick={() =>
          setModal({ type: "category", name: "", slug: "", image: "", order: 0 })
        }
        className="btn-amz"
      >
        <Plus className="size-4" /> Yeni kategori
      </button>

      {categories.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500">
          Henüz kategori yok.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex flex-col rounded-lg border border-zinc-200 bg-white p-4"
            >
              <div className="flex gap-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded border border-zinc-200 bg-white">
                  <SafeImage
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-zinc-900">{category.name}</h3>
                  <p className="text-xs text-zinc-500">/{category.slug}</p>
                  <p className="text-xs text-zinc-500">
                    {category._count.products} ürün · sıra {category.order}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex gap-3 border-b border-zinc-100 pb-3 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setModal({
                      type: "category",
                      id: category.id,
                      name: category.name,
                      slug: category.slug,
                      image: category.image ?? "",
                      order: category.order,
                    })
                  }
                  className="inline-flex items-center gap-1 text-amz-link hover:text-amz-link-hover"
                >
                  <Pencil className="size-3.5" /> Düzenle
                </button>
                <DeleteButton endpoint={`/api/categories/${category.id}`} />
              </div>

              <div className="mt-3 space-y-1.5">
                <p className="text-xs font-semibold uppercase text-zinc-500">
                  Alt kategoriler
                </p>
                {category.subCategories.length === 0 && (
                  <p className="text-xs text-zinc-400">Yok</p>
                )}
                {category.subCategories.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between gap-2 rounded bg-zinc-50 px-2 py-1.5 text-sm"
                  >
                    <span className="min-w-0 truncate text-zinc-700">
                      {sub.name}
                      <span className="ml-1 text-xs text-zinc-400">
                        ({sub._count.products})
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setModal({
                            type: "sub",
                            id: sub.id,
                            name: sub.name,
                            slug: sub.slug,
                            categoryId: category.id,
                          })
                        }
                        className="text-xs text-amz-link hover:text-amz-link-hover"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <DeleteButton
                        endpoint={`/api/subcategories/${sub.id}`}
                        label=""
                      />
                    </span>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setModal({ type: "sub", name: "", slug: "", categoryId: category.id })
                  }
                  className="mt-1 inline-flex items-center gap-1 text-xs text-amz-link hover:text-amz-link-hover"
                >
                  <Plus className="size-3.5" /> Alt kategori ekle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-90 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
          <div className="animate-fade-in max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">
                {modal.type === "category"
                  ? modal.id
                    ? "Kategoriyi düzenle"
                    : "Yeni kategori"
                  : modal.id
                    ? "Alt kategoriyi düzenle"
                    : "Yeni alt kategori"}
              </h2>
              <button type="button" onClick={() => setModal(null)} aria-label="Kapat">
                <X className="size-5 text-zinc-500" />
              </button>
            </div>

            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Ad *</label>
                <input
                  required
                  value={modal.name}
                  onChange={(e) => setModal({ ...modal, name: e.target.value })}
                  className="input-amz"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Slug (boş bırakılırsa otomatik)
                </label>
                <input
                  value={modal.slug}
                  onChange={(e) => setModal({ ...modal, slug: e.target.value })}
                  className="input-amz"
                />
              </div>

              {modal.type === "category" && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">
                      Sıralama
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={modal.order}
                      onChange={(e) => setModal({ ...modal, order: Number(e.target.value) })}
                      className="input-amz"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">
                      Kategori görseli
                    </label>
                    <ImageUploader
                      images={modal.image ? [modal.image] : []}
                      onChange={(images) => setModal({ ...modal, image: images[0] ?? "" })}
                      folder="amazon-clone/categories"
                      max={1}
                    />
                  </div>
                </>
              )}

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
