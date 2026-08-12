"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";
import { finalPrice, formatPrice } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  subCategories: { id: string; name: string }[];
};

export type ProductFormValues = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  details: string;
  brand: string;
  sku: string;
  images: string[];
  price: number;
  discountPercent: number;
  stock: number;
  colors: { name: string; hex: string }[];
  sizes: string[];
  tags: string[];
  featured: boolean;
  isActive: boolean;
  shippingFree: boolean;
  categoryId: string;
  subCategoryId: string;
};

export const EMPTY_PRODUCT: ProductFormValues = {
  title: "",
  slug: "",
  description: "",
  details: "",
  brand: "",
  sku: "",
  images: [],
  price: 0,
  discountPercent: 0,
  stock: 0,
  colors: [],
  sizes: [],
  tags: [],
  featured: false,
  isActive: true,
  shippingFree: false,
  categoryId: "",
  subCategoryId: "",
};

export function ProductForm({
  categories,
  initial,
}: {
  categories: Category[];
  initial?: ProductFormValues;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState<ProductFormValues>(initial ?? EMPTY_PRODUCT);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [sizeInput, setSizeInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [colorInput, setColorInput] = useState({ name: "", hex: "#000000" });

  const subCategories = useMemo(
    () => categories.find((c) => c.id === form.categoryId)?.subCategories ?? [],
    [categories, form.categoryId],
  );

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFields({});

    if (form.images.length === 0) {
      toast("En az bir görsel ekleyin", "error");
      return;
    }
    if (!form.categoryId) {
      toast("Kategori seçin", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        form.id ? `/api/products/${form.id}` : "/api/products",
        {
          method: form.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            subCategoryId: form.subCategoryId || null,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        if (data.fields) setFields(data.fields);
        throw new Error(data.message ?? "Kaydedilemedi");
      }

      toast(form.id ? "Ürün güncellendi" : "Ürün oluşturuldu");
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="font-bold text-zinc-900">Temel bilgiler</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Ürün adı *</label>
            <input
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="input-amz"
            />
            {fields.title && <p className="mt-1 text-xs text-rose-600">{fields.title}</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Slug (boş bırakılırsa otomatik)
              </label>
              <input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                className="input-amz"
                placeholder="urun-adi"
              />
              {fields.slug && <p className="mt-1 text-xs text-rose-600">{fields.slug}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Marka</label>
              <input
                value={form.brand}
                onChange={(e) => set("brand", e.target.value)}
                className="input-amz"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Açıklama *</label>
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="input-amz resize-y"
            />
            {fields.description && (
              <p className="mt-1 text-xs text-rose-600">{fields.description}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Detaylar (teknik özellikler)
            </label>
            <textarea
              rows={4}
              value={form.details}
              onChange={(e) => set("details", e.target.value)}
              className="input-amz resize-y"
            />
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="font-bold text-zinc-900">Görseller *</h2>
          <ImageUploader images={form.images} onChange={(images) => set("images", images)} />
        </section>

        <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="font-bold text-zinc-900">Varyantlar</h2>

          {/* Renkler */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Renkler</label>
            <div className="mb-2 flex flex-wrap gap-2">
              {form.colors.map((color) => (
                <span
                  key={color.name}
                  className="flex items-center gap-1.5 rounded-full border border-zinc-200 py-1 pl-1.5 pr-2 text-sm"
                >
                  <span
                    className="size-4 rounded-full border border-zinc-300"
                    style={{ backgroundColor: color.hex }}
                  />
                  {color.name}
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "colors",
                        form.colors.filter((c) => c.name !== color.name),
                      )
                    }
                    aria-label="Sil"
                  >
                    <X className="size-3.5 text-zinc-400 hover:text-rose-600" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={colorInput.name}
                onChange={(e) => setColorInput({ ...colorInput, name: e.target.value })}
                placeholder="Renk adı (ör. Siyah)"
                className="input-amz"
              />
              <input
                type="color"
                value={colorInput.hex}
                onChange={(e) => setColorInput({ ...colorInput, hex: e.target.value })}
                className="h-10 w-14 shrink-0 cursor-pointer rounded border border-zinc-300"
              />
              <button
                type="button"
                onClick={() => {
                  if (!colorInput.name.trim()) return;
                  if (form.colors.some((c) => c.name === colorInput.name.trim())) return;
                  set("colors", [
                    ...form.colors,
                    { name: colorInput.name.trim(), hex: colorInput.hex },
                  ]);
                  setColorInput({ name: "", hex: "#000000" });
                }}
                className="btn-amz-outline shrink-0"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          {/* Bedenler */}
          <TokenInput
            label="Bedenler / ölçüler"
            placeholder="ör. M, 42, 128 GB"
            value={sizeInput}
            onValueChange={setSizeInput}
            tokens={form.sizes}
            onTokensChange={(sizes) => set("sizes", sizes)}
          />

          {/* Etiketler */}
          <TokenInput
            label="Etiketler (arama için)"
            placeholder="ör. kablosuz, oyuncu"
            value={tagInput}
            onValueChange={setTagInput}
            tokens={form.tags}
            onTokensChange={(tags) => set("tags", tags)}
          />
        </section>
      </div>

      {/* Sağ kolon */}
      <div className="space-y-4">
        <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="font-bold text-zinc-900">Fiyat ve stok</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Fiyat (€) *</label>
            <input
              type="number"
              required
              min={0.01}
              step={0.01}
              value={form.price}
              onChange={(e) => set("price", Number(e.target.value))}
              className="input-amz"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">İndirim (%)</label>
            <input
              type="number"
              min={0}
              max={95}
              value={form.discountPercent}
              onChange={(e) => set("discountPercent", Number(e.target.value))}
              className="input-amz"
            />
            {form.discountPercent > 0 && (
              <p className="mt-1 text-xs text-amz-success">
                Satış fiyatı: {formatPrice(finalPrice(form.price, form.discountPercent))}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Stok adedi</label>
            <input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => set("stock", Number(e.target.value))}
              className="input-amz"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Stok kodu (SKU)</label>
            <input
              value={form.sku}
              onChange={(e) => set("sku", e.target.value)}
              className="input-amz"
            />
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="font-bold text-zinc-900">Kategori</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Kategori *</label>
            <select
              required
              value={form.categoryId}
              onChange={(e) => {
                set("categoryId", e.target.value);
                set("subCategoryId", "");
              }}
              className="input-amz"
            >
              <option value="">Seçin…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Alt kategori</label>
            <select
              value={form.subCategoryId}
              onChange={(e) => set("subCategoryId", e.target.value)}
              disabled={subCategories.length === 0}
              className="input-amz disabled:bg-zinc-100"
            >
              <option value="">Yok</option>
              {subCategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="space-y-2.5 rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="font-bold text-zinc-900">Görünürlük</h2>

          <Toggle
            label="Yayında"
            checked={form.isActive}
            onChange={(v) => set("isActive", v)}
          />
          <Toggle
            label="Öne çıkan ürün"
            checked={form.featured}
            onChange={(v) => set("featured", v)}
          />
          <Toggle
            label="Ücretsiz kargo"
            checked={form.shippingFree}
            onChange={(v) => set("shippingFree", v)}
          />
        </section>

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-amz flex-1">
            {saving && <Spinner />}
            {form.id ? "Güncelle" : "Ürünü oluştur"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="btn-amz-outline"
          >
            Vazgeç
          </button>
        </div>
      </div>
    </form>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between text-sm text-zinc-700">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-amz-orange"
      />
    </label>
  );
}

function TokenInput({
  label,
  placeholder,
  value,
  onValueChange,
  tokens,
  onTokensChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  tokens: string[];
  onTokensChange: (tokens: string[]) => void;
}) {
  function add() {
    const trimmed = value.trim();
    if (!trimmed || tokens.includes(trimmed)) return;
    onTokensChange([...tokens, trimmed]);
    onValueChange("");
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700">{label}</label>
      <div className="mb-2 flex flex-wrap gap-2">
        {tokens.map((token) => (
          <span
            key={token}
            className="flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-sm"
          >
            {token}
            <button
              type="button"
              onClick={() => onTokensChange(tokens.filter((t) => t !== token))}
              aria-label="Sil"
            >
              <X className="size-3.5 text-zinc-400 hover:text-rose-600" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="input-amz"
        />
        <button type="button" onClick={add} className="btn-amz-outline shrink-0">
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
