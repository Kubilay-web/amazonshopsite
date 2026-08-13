"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";
import type { SiteSettings } from "@/lib/settings";

type Section = { title: string; description: string };

const SECTIONS: Record<string, Section> = {
  identity: { title: "Mağaza kimliği", description: "Site adı ve iletişim bilgileri." },
  announcement: {
    title: "Duyuru şeridi",
    description: "Mağazanın en üstünde görünen ince duyuru bandı.",
  },
  commerce: {
    title: "Ticaret kuralları",
    description: "Kargo, vergi ve sipariş eşikleri. Tüm hesaplamalar sunucuda bu değerlerle yapılır.",
  },
  toggles: { title: "Özellik anahtarları", description: "Mağaza davranışını aç/kapat." },
  maintenance: {
    title: "Bakım modu",
    description: "Açıldığında ziyaretçiler bakım sayfasına yönlendirilir; yöneticiler girmeye devam eder.",
  },
  social: { title: "Sosyal medya", description: "Alt bilgide gösterilen bağlantılar." },
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-zinc-200 p-3 hover:bg-zinc-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-amz-orange"
      />
      <span>
        <span className="block text-sm font-medium text-zinc-800">{label}</span>
        {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
      </span>
    </label>
  );
}

function Card({ section, children }: { section: Section; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 p-4">
        <h2 className="text-lg font-bold text-zinc-900">{section.title}</h2>
        <p className="text-sm text-zinc-600">{section.description}</p>
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </section>
  );
}

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<SiteSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        throw new Error(data.message ?? "Kaydedilemedi");
      }
      setForm(data.settings);
      toast("Ayarlar kaydedildi");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Card section={SECTIONS.identity}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Site adı *">
            <input
              required
              value={form.siteName}
              onChange={(e) => set("siteName", e.target.value)}
              className="input-amz"
            />
            {errors.siteName && <p className="mt-1 text-xs text-rose-600">{errors.siteName}</p>}
          </Field>
          <Field label="Destek e-postası">
            <input
              type="email"
              value={form.supportEmail}
              onChange={(e) => set("supportEmail", e.target.value)}
              className="input-amz"
              placeholder="destek@magaza.com"
            />
          </Field>
        </div>
        <Field
          label="Site açıklaması"
          hint="Tarayıcı sekmesi ve arama motoru sonuçlarındaki meta açıklama."
        >
          <input
            value={form.siteDescription}
            onChange={(e) => set("siteDescription", e.target.value)}
            className="input-amz"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Destek telefonu">
            <input
              value={form.supportPhone}
              onChange={(e) => set("supportPhone", e.target.value)}
              className="input-amz"
            />
          </Field>
          <Field label="Adres">
            <input
              value={form.contactAddress}
              onChange={(e) => set("contactAddress", e.target.value)}
              className="input-amz"
            />
          </Field>
        </div>
      </Card>

      <Card section={SECTIONS.announcement}>
        <Toggle
          label="Duyuru şeridini göster"
          checked={form.announcementActive}
          onChange={(v) => set("announcementActive", v)}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field label="Duyuru metni">
              <input
                value={form.announcement}
                onChange={(e) => set("announcement", e.target.value)}
                className="input-amz"
                placeholder="50 € üzeri kargo bedava!"
              />
            </Field>
          </div>
          <Field label="Bağlantı">
            <input
              value={form.announcementLink}
              onChange={(e) => set("announcementLink", e.target.value)}
              className="input-amz"
              placeholder="/search?discounted=true"
            />
          </Field>
        </div>
      </Card>

      <Card section={SECTIONS.commerce}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Bedava kargo limiti (€)" hint="Bu tutarın üzerinde kargo ücretsiz.">
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.freeShippingLimit}
              onChange={(e) => set("freeShippingLimit", Number(e.target.value))}
              className="input-amz"
            />
          </Field>
          <Field label="Kargo ücreti (€)">
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.shippingCost}
              onChange={(e) => set("shippingCost", Number(e.target.value))}
              className="input-amz"
            />
          </Field>
          <Field
            label="KDV oranı (%)"
            hint="0 = fiyatlara dahil, ayrı satır gösterilmez. Sıfırdan büyükse indirim sonrası tutara eklenir."
          >
            <input
              type="number"
              min={0}
              max={100}
              value={form.taxRate}
              onChange={(e) => set("taxRate", Number(e.target.value))}
              className="input-amz"
            />
          </Field>
          <Field label="Minimum sipariş tutarı (€)" hint="0 = sınır yok.">
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.minOrderAmount}
              onChange={(e) => set("minOrderAmount", Number(e.target.value))}
              className="input-amz"
            />
          </Field>
          <Field label="Kritik stok eşiği" hint="Panodaki uyarılar bu değere göre çıkar.">
            <input
              type="number"
              min={0}
              value={form.lowStockThreshold}
              onChange={(e) => set("lowStockThreshold", Number(e.target.value))}
              className="input-amz"
            />
          </Field>
        </div>
      </Card>

      <Card section={SECTIONS.toggles}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle
            label="Kapıda ödeme"
            hint="Ödeme adımında kapıda ödeme seçeneği sunulur."
            checked={form.codEnabled}
            onChange={(v) => set("codEnabled", v)}
          />
          <Toggle
            label="Stripe ile ödeme"
            hint="Kapatılırsa kart ile ödeme gizlenir."
            checked={form.stripeEnabled}
            onChange={(v) => set("stripeEnabled", v)}
          />
          <Toggle
            label="Ürün yorumları"
            hint="Kapatılırsa yeni yorum gönderilemez."
            checked={form.reviewsEnabled}
            onChange={(v) => set("reviewsEnabled", v)}
          />
          <Toggle
            label="Yeni üyelik kaydı"
            hint="Kapatılırsa kayıt formu devre dışı kalır."
            checked={form.registrationOpen}
            onChange={(v) => set("registrationOpen", v)}
          />
        </div>
      </Card>

      <Card section={SECTIONS.maintenance}>
        <Toggle
          label="Bakım modunu aç"
          hint="Mağaza ziyaretçilere kapanır. Yöneticiler etkilenmez."
          checked={form.maintenanceMode}
          onChange={(v) => set("maintenanceMode", v)}
        />
        <Field label="Bakım mesajı">
          <textarea
            rows={2}
            value={form.maintenanceMessage}
            onChange={(e) => set("maintenanceMessage", e.target.value)}
            className="input-amz resize-y"
          />
        </Field>
      </Card>

      <Card section={SECTIONS.social}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Facebook">
            <input
              value={form.facebook}
              onChange={(e) => set("facebook", e.target.value)}
              className="input-amz"
              placeholder="https://facebook.com/…"
            />
          </Field>
          <Field label="Instagram">
            <input
              value={form.instagram}
              onChange={(e) => set("instagram", e.target.value)}
              className="input-amz"
              placeholder="https://instagram.com/…"
            />
          </Field>
          <Field label="X (Twitter)">
            <input
              value={form.twitter}
              onChange={(e) => set("twitter", e.target.value)}
              className="input-amz"
              placeholder="https://x.com/…"
            />
          </Field>
          <Field label="YouTube">
            <input
              value={form.youtube}
              onChange={(e) => set("youtube", e.target.value)}
              className="input-amz"
              placeholder="https://youtube.com/…"
            />
          </Field>
        </div>
      </Card>

      <div className="sticky bottom-0 flex justify-end gap-2 rounded-lg border border-zinc-200 bg-white p-3">
        <button
          type="button"
          onClick={() => setForm(initial)}
          disabled={saving}
          className="btn-amz-outline"
        >
          Sıfırla
        </button>
        <button type="submit" disabled={saving} className="btn-amz">
          {saving ? <Spinner /> : <Save className="size-4" />} Ayarları kaydet
        </button>
      </div>
    </form>
  );
}
