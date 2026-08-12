"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils";

export type Address = {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

const EMPTY = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Türkiye",
  isDefault: false,
};

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function startNew() {
    setForm(EMPTY);
    setEditing(null);
    setOpen(true);
  }

  function startEdit(address: Address) {
    setForm({
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setEditing(address.id);
    setOpen(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/addresses/${editing}` : "/api/addresses", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Adres kaydedilemedi");

      toast(editing ? "Adres güncellendi" : "Adres eklendi");
      setOpen(false);
      setEditing(null);
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Adres silindi");
      router.refresh();
    } else {
      toast("Adres silinemedi", "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={startNew}
          className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-amz-border bg-white p-6 text-zinc-500 transition hover:border-amz-orange hover:text-amz-orange"
        >
          <Plus className="size-9" strokeWidth={1.5} />
          <span className="text-base font-medium">Adres ekle</span>
        </button>

        {addresses.map((address) => (
          <div
            key={address.id}
            className={cn(
              "flex flex-col rounded-lg border bg-white p-4 text-sm",
              address.isDefault ? "border-amz-orange" : "border-amz-border",
            )}
          >
            {address.isDefault && (
              <span className="mb-2 flex items-center gap-1 text-xs font-semibold text-amz-orange">
                <MapPin className="size-3.5" /> Varsayılan adres
              </span>
            )}
            <p className="font-bold text-zinc-900">{address.fullName}</p>
            <p className="text-zinc-700">{address.addressLine1}</p>
            {address.addressLine2 && <p className="text-zinc-700">{address.addressLine2}</p>}
            <p className="text-zinc-700">
              {address.state} / {address.city} {address.postalCode}
            </p>
            <p className="text-zinc-700">{address.country}</p>
            <p className="text-zinc-500">{address.phone}</p>

            <div className="mt-auto flex gap-3 pt-3 text-sm">
              <button
                type="button"
                onClick={() => startEdit(address)}
                className="flex items-center gap-1 text-amz-link hover:text-amz-link-hover"
              >
                <Pencil className="size-3.5" /> Düzenle
              </button>
              <button
                type="button"
                onClick={() => remove(address.id)}
                className="flex items-center gap-1 text-amz-link hover:text-amz-link-hover"
              >
                <Trash2 className="size-3.5" /> Sil
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Form modalı */}
      {open && (
        <div className="fixed inset-0 z-90 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="animate-fade-in max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-lg">
            <h2 className="mb-4 text-lg font-bold text-zinc-900">
              {editing ? "Adresi düzenle" : "Yeni adres ekle"}
            </h2>

            <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="Ad Soyad"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="input-amz sm:col-span-2"
              />
              <input
                required
                placeholder="Telefon"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-amz sm:col-span-2"
              />
              <input
                required
                placeholder="Adres satırı 1 (mahalle, cadde, no)"
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                className="input-amz sm:col-span-2"
              />
              <input
                placeholder="Adres satırı 2 (daire, kat — isteğe bağlı)"
                value={form.addressLine2}
                onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                className="input-amz sm:col-span-2"
              />
              <input
                required
                placeholder="İlçe"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="input-amz"
              />
              <input
                required
                placeholder="Şehir"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="input-amz"
              />
              <input
                required
                placeholder="Posta kodu"
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                className="input-amz"
              />
              <input
                required
                placeholder="Ülke"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="input-amz"
              />

              <label className="flex items-center gap-2 text-sm text-zinc-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="size-4 accent-amz-orange"
                />
                Varsayılan teslimat adresim olsun
              </label>

              <div className="flex gap-2 sm:col-span-2">
                <button type="submit" disabled={saving} className="btn-amz flex-1">
                  {saving && <Spinner />} Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
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
