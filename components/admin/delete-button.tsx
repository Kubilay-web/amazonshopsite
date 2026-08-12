"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";

/** Onaylı silme butonu. Tarayıcı confirm() yerine satır içi onay kullanır. */
export function DeleteButton({
  endpoint,
  label = "Sil",
  confirmLabel = "Emin misiniz?",
  onDeleted,
}: {
  endpoint: string;
  label?: string;
  confirmLabel?: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function remove() {
    setLoading(true);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Silinemedi");
      toast("Kayıt silindi");
      onDeleted?.();
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Silinemedi", "error");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <span className="text-zinc-600">{confirmLabel}</span>
        <button
          type="button"
          onClick={remove}
          disabled={loading}
          className="rounded bg-rose-600 px-2 py-1 font-medium text-white hover:bg-rose-700"
        >
          {loading ? <Spinner className="size-3" /> : "Evet"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded border border-zinc-300 px-2 py-1"
        >
          Hayır
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800"
    >
      <Trash2 className="size-3.5" /> {label}
    </button>
  );
}
