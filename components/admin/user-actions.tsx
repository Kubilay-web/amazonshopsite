"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";

export function UserActions({
  userId,
  role,
  blocked,
  isSelf,
}: {
  userId: string;
  role: "USER" | "ADMIN";
  blocked: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function patch(body: Record<string, unknown>, message: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Güncellenemedi");
      toast(message);
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  }

  if (isSelf) {
    return <span className="text-xs text-zinc-400">Kendi hesabınız</span>;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {loading && <Spinner className="size-3.5" />}
      <select
        value={role}
        disabled={loading}
        onChange={(e) => patch({ role: e.target.value }, "Rol güncellendi")}
        className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs"
      >
        <option value="USER">Kullanıcı</option>
        <option value="ADMIN">Yönetici</option>
      </select>

      <button
        type="button"
        disabled={loading}
        onClick={() =>
          patch({ blocked: !blocked }, blocked ? "Hesap aktifleştirildi" : "Hesap askıya alındı")
        }
        className={`rounded px-2 py-1 text-xs font-medium ${
          blocked
            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            : "bg-rose-100 text-rose-700 hover:bg-rose-200"
        }`}
      >
        {blocked ? "Aktifleştir" : "Askıya al"}
      </button>
    </div>
  );
}
