"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { finalPrice, round2 } from "@/lib/utils";
import type { CartLine } from "@/types";

const STORAGE_KEY = "amz_cart_v1";

type AddInput = Omit<CartLine, "qty"> & { qty?: number };

type CartContextValue = {
  items: CartLine[];
  ready: boolean;
  count: number;
  subtotal: number;
  add: (item: AddInput) => Promise<void>;
  updateQty: (key: string, qty: number) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  lineKey: (item: Pick<CartLine, "productId" | "size" | "color">) => string;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart, CartProvider içinde kullanılmalı");
  return ctx;
}

function keyOf(item: Pick<CartLine, "productId" | "size" | "color">) {
  return `${item.productId}|${item.size ?? ""}|${item.color ?? ""}`;
}

function readLocal(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(items: CartLine[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // kota dolu olabilir, yok say
  }
}

function mergeLines(base: CartLine[], extra: CartLine[]) {
  const map = new Map<string, CartLine>();
  for (const line of [...base, ...extra]) {
    const k = keyOf(line);
    const prev = map.get(k);
    map.set(k, prev ? { ...prev, qty: Math.min(99, prev.qty + line.qty) } : { ...line });
  }
  return [...map.values()];
}

function toRaw(items: CartLine[]) {
  return items.map((i) => ({
    productId: i.productId,
    qty: i.qty,
    size: i.size,
    color: i.color,
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const user = useAuth();
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const userId = user?.id ?? null;
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // İlk yükleme: misafir sepeti localStorage'dan, üye sepeti veritabanından.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const local = readLocal();

      if (!userId) {
        if (!cancelled) {
          setItems(local);
          setReady(true);
        }
        return;
      }

      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        const data = res.ok ? await res.json() : { items: [] };
        let merged: CartLine[] = data.items ?? [];

        // Giriş öncesi misafir sepeti varsa birleştirilip sunucuya yazılır
        if (local.length > 0) {
          merged = mergeLines(merged, local);
          const put = await fetch("/api/cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: toRaw(merged) }),
          });
          if (put.ok) merged = (await put.json()).items ?? merged;
          writeLocal([]);
        }

        if (!cancelled) setItems(merged);
      } catch {
        if (!cancelled) setItems(local);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    // Sepet dış bir kaynaktan (localStorage / sunucu) senkronize ediliyor;
    // kullanıcı değiştiğinde önce "hazır değil" durumuna dönmemiz gerekiyor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(false);
    init();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  /** Değişikliği kalıcı hale getirir (üye → DB, misafir → localStorage). */
  const persist = useCallback(
    (next: CartLine[]) => {
      if (!userId) {
        writeLocal(next);
        return;
      }
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: toRaw(next) }),
        }).catch(() => null);
      }, 250);
    },
    [userId],
  );

  const apply = useCallback(
    (updater: (prev: CartLine[]) => CartLine[]) => {
      setItems((prev) => {
        const next = updater(prev);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const add = useCallback(
    async (item: AddInput) => {
      const qty = Math.max(1, item.qty ?? 1);
      apply((prev) => {
        const k = keyOf(item);
        const existing = prev.find((l) => keyOf(l) === k);
        if (existing) {
          const max = Math.max(1, existing.stock || 99);
          return prev.map((l) =>
            keyOf(l) === k ? { ...l, qty: Math.min(max, Math.min(99, l.qty + qty)) } : l,
          );
        }
        return [...prev, { ...item, qty }];
      });
    },
    [apply],
  );

  const updateQty = useCallback(
    async (key: string, qty: number) => {
      if (qty < 1) {
        apply((prev) => prev.filter((l) => keyOf(l) !== key));
        return;
      }
      apply((prev) =>
        prev.map((l) =>
          keyOf(l) === key
            ? { ...l, qty: Math.min(99, Math.min(qty, Math.max(1, l.stock || 99))) }
            : l,
        ),
      );
    },
    [apply],
  );

  const remove = useCallback(
    async (key: string) => {
      apply((prev) => prev.filter((l) => keyOf(l) !== key));
    },
    [apply],
  );

  const clear = useCallback(async () => {
    setItems([]);
    if (userId) {
      await fetch("/api/cart", { method: "DELETE" }).catch(() => null);
    } else {
      writeLocal([]);
    }
  }, [userId]);

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const subtotal = useMemo(
    () => round2(items.reduce((s, i) => s + finalPrice(i.price, i.discountPercent) * i.qty, 0)),
    [items],
  );

  const value = useMemo(
    () => ({ items, ready, count, subtotal, add, updateQty, remove, clear, lineKey: keyOf }),
    [items, ready, count, subtotal, add, updateQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
