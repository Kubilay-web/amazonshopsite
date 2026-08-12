"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/providers/auth-provider";

type WishlistContextValue = {
  ids: Set<string>;
  has: (productId: string) => boolean;
  toggle: (productId: string) => Promise<boolean | null>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist, WishlistProvider içinde kullanılmalı");
  return ctx;
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const user = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      // Çıkış yapıldığında sunucudaki favori listesiyle senkron kalmak için sıfırla
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIds(new Set());
      return;
    }
    fetch("/api/wishlist", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => {
        if (cancelled) return;
        const next = new Set<string>(
          (data.items ?? []).map((i: { productId: string }) => i.productId),
        );
        setIds(next);
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [user]);

  /** Favoriye ekler/çıkarır. Giriş yoksa null döner. */
  const toggle = useCallback(
    async (productId: string) => {
      if (!user) return null;

      // İyimser güncelleme
      const wasIn = ids.has(productId);
      setIds((prev) => {
        const next = new Set(prev);
        if (wasIn) next.delete(productId);
        else next.add(productId);
        return next;
      });

      try {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        return Boolean(data.added);
      } catch {
        setIds((prev) => {
          const next = new Set(prev);
          if (wasIn) next.add(productId);
          else next.delete(productId);
          return next;
        });
        return null;
      }
    },
    [ids, user],
  );

  const value = useMemo(
    () => ({ ids, has: (id: string) => ids.has(id), toggle }),
    [ids, toggle],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
