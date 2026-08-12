"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/providers/toast-provider";
import { useCart } from "@/components/providers/cart-provider";

/**
 * Stripe dönüşünde ödemeyi doğrular (webhook yoksa da çalışsın diye)
 * ve sepeti temizler.
 */
export function PaymentVerifier({
  orderId,
  sessionId,
  isPaid,
}: {
  orderId: string;
  sessionId: string;
  isPaid: boolean;
}) {
  const router = useRouter();
  const { clear } = useCart();
  const done = useRef(false);
  const [checking, setChecking] = useState(!isPaid);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    clear();

    if (isPaid) return;

    fetch("/api/checkout/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, sessionId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.paid) router.refresh();
      })
      .catch(() => null)
      .finally(() => setChecking(false));
  }, [clear, isPaid, orderId, router, sessionId]);

  if (!checking) return null;

  return (
    <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <Spinner /> Ödemeniz doğrulanıyor…
    </div>
  );
}

/** Kullanıcı siparişini iptal eder. */
export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function cancel() {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "İptal edilemedi");
      toast("Sipariş iptal edildi");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-700">Emin misiniz?</span>
        <button type="button" onClick={cancel} disabled={loading} className="btn-amz">
          {loading && <Spinner />} Evet, iptal et
        </button>
        <button type="button" onClick={() => setConfirm(false)} className="btn-amz-outline">
          Vazgeç
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setConfirm(true)} className="btn-amz-outline">
      Siparişi iptal et
    </button>
  );
}
