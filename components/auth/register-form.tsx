"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const redirectTo = params.get("redirect") || "/";

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFields({});

    if (form.password !== form.confirm) {
      setFields({ confirm: "Şifreler eşleşmiyor" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fields) setFields(data.fields);
        throw new Error(data.message ?? "Kayıt oluşturulamadı");
      }

      toast("Hesabınız oluşturuldu");
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
      setLoading(false);
    }
  }

  return (
    <>
      <div className="rounded-lg border border-amz-border bg-white p-5">
        <h1 className="mb-4 text-2xl font-normal text-zinc-900">Hesap oluştur</h1>

        {error && (
          <div className="mb-3 flex items-start gap-2 rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-bold text-zinc-900">
              Adınız
            </label>
            <input
              id="name"
              required
              minLength={2}
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-amz"
            />
            {fields.name && <p className="mt-1 text-xs text-rose-600">{fields.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-bold text-zinc-900">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-amz"
            />
            {fields.email && <p className="mt-1 text-xs text-rose-600">{fields.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-bold text-zinc-900">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-amz"
            />
            <p className="mt-1 text-xs text-zinc-500">En az 6 karakter</p>
            {fields.password && <p className="mt-1 text-xs text-rose-600">{fields.password}</p>}
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm font-bold text-zinc-900">
              Şifreyi tekrar girin
            </label>
            <input
              id="confirm"
              type="password"
              required
              autoComplete="new-password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className="input-amz"
            />
            {fields.confirm && <p className="mt-1 text-xs text-rose-600">{fields.confirm}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-amz w-full">
            {loading && <Spinner />}
            Hesabınızı oluşturun
          </button>
        </form>

        <p className="mt-4 border-t border-amz-border pt-3 text-sm text-zinc-700">
          Zaten bir hesabınız var mı?{" "}
          <Link
            href={`/login${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="text-amz-link hover:text-amz-link-hover"
          >
            Giriş yapın
          </Link>
        </p>
      </div>
    </>
  );
}
