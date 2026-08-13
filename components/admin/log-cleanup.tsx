"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eraser } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";

/** 30 günden eski denetim kayıtlarını temizler. */
export function LogCleanup() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function clear() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/logs", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Temizlenemedi");
      toast(`${data.count} eski kayıt temizlendi`);
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2 text-sm">
        <span className="text-zinc-600">30 günden eski kayıtlar silinsin mi?</span>
        <button type="button" onClick={clear} disabled={loading} className="btn-amz">
          {loading && <Spinner />} Evet, temizle
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="btn-amz-outline"
        >
          Vazgeç
        </button>
      </span>
    );
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} className="btn-amz-outline">
      <Eraser className="size-4" /> Eski kayıtları temizle
    </button>
  );
}
