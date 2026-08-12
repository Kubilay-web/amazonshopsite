"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";

export function ProfileForm({
  user,
}: {
  user: { name: string; email: string; phone: string | null; image: string | null };
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone ?? "",
    image: user.image ?? "",
  });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Kaydedilemedi");
      toast("Profiliniz güncellendi");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setSavingPassword(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwords),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Şifre değiştirilemedi");
      toast("Şifreniz güncellendi");
      setPasswords({ currentPassword: "", newPassword: "" });
    } catch (error) {
      toast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form onSubmit={saveProfile} className="space-y-3 rounded-lg border border-amz-border bg-white p-5">
        <h2 className="text-lg font-bold text-zinc-900">Profil bilgileri</h2>

        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-bold text-zinc-900">
            Ad Soyad
          </label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-amz"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-zinc-900">E-posta</label>
          <input value={user.email} disabled className="input-amz bg-zinc-100 text-zinc-500" />
          <p className="mt-1 text-xs text-zinc-500">E-posta adresi değiştirilemez.</p>
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-bold text-zinc-900">
            Telefon
          </label>
          <input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="input-amz"
          />
        </div>

        <div>
          <label htmlFor="image" className="mb-1 block text-sm font-bold text-zinc-900">
            Profil görseli (URL)
          </label>
          <input
            id="image"
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
            placeholder="https://…"
            className="input-amz"
          />
        </div>

        <button type="submit" disabled={savingProfile} className="btn-amz w-full">
          {savingProfile && <Spinner />} Değişiklikleri kaydet
        </button>
      </form>

      <form
        onSubmit={savePassword}
        className="space-y-3 rounded-lg border border-amz-border bg-white p-5"
      >
        <h2 className="text-lg font-bold text-zinc-900">Şifre değiştir</h2>

        <div>
          <label htmlFor="currentPassword" className="mb-1 block text-sm font-bold text-zinc-900">
            Mevcut şifre
          </label>
          <input
            id="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            value={passwords.currentPassword}
            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
            className="input-amz"
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="mb-1 block text-sm font-bold text-zinc-900">
            Yeni şifre
          </label>
          <input
            id="newPassword"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={passwords.newPassword}
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            className="input-amz"
          />
          <p className="mt-1 text-xs text-zinc-500">En az 6 karakter</p>
        </div>

        <button type="submit" disabled={savingPassword} className="btn-amz w-full">
          {savingPassword && <Spinner />} Şifreyi güncelle
        </button>
      </form>
    </div>
  );
}
