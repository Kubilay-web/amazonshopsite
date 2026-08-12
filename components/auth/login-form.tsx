"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const redirectTo = params.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Giriş yapılamadı");

      toast(`Hoş geldiniz, ${data.user.name.split(" ")[0]}`);
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
        <h1 className="mb-4 text-2xl font-normal text-zinc-900">Giriş yap</h1>

        {error && (
          <div className="mb-3 flex items-start gap-2 rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-bold text-zinc-900">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-amz"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-bold text-zinc-900">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-amz"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-amz w-full">
            {loading && <Spinner />}
            Giriş yap
          </button>
        </form>

        <p className="mt-4 text-xs leading-relaxed text-zinc-600">
          Giriş yaparak Amazon Clone Kullanım Koşulları&apos;nı ve Gizlilik Bildirimi&apos;ni
          kabul etmiş olursunuz.
        </p>
      </div>

      <div className="relative my-5 text-center">
        <span className="relative z-10 bg-white px-3 text-xs text-zinc-500">
          Amazon Clone&apos;da yeni misiniz?
        </span>
        <span className="absolute inset-x-0 top-1/2 h-px bg-amz-border" />
      </div>

      <Link
        href={`/register${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
        className="btn-amz-outline w-full"
      >
        Yeni hesap oluştur
      </Link>
    </>
  );
}
