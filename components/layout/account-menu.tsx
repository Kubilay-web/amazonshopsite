"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, Heart, Package, User } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";

export function AccountMenu() {
  const user = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onEsc(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    toast("Çıkış yapıldı");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-sm border border-transparent px-2 py-1 text-left text-white hover:border-white"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="hidden leading-tight sm:block">
          <span className="block text-[11px]">
            Merhaba, {user ? user.name.split(" ")[0] : "Giriş yapın"}
          </span>
          <span className="flex items-center gap-0.5 text-sm font-bold">
            Hesap &amp; Listeler
            <ChevronDown className="size-3" />
          </span>
        </div>
        <User className="size-6 sm:hidden" />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-fade-in absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-lg border border-amz-border bg-white shadow-xl"
        >
          {user ? (
            <>
              <div className="border-b border-amz-border px-4 py-3">
                <p className="truncate text-sm font-semibold text-zinc-900">{user.name}</p>
                <p className="truncate text-xs text-zinc-500">{user.email}</p>
              </div>
              <nav className="py-1 text-sm text-zinc-800">
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-amz-light"
                >
                  <User className="size-4" /> Hesabım
                </Link>
                <Link
                  href="/account/orders"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-amz-light"
                >
                  <Package className="size-4" /> Siparişlerim
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-amz-light"
                >
                  <Heart className="size-4" /> Favorilerim
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 font-medium text-amz-link hover:bg-amz-light"
                  >
                    <LayoutDashboard className="size-4" /> Yönetim Paneli
                  </Link>
                )}
              </nav>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-2 border-t border-amz-border px-4 py-2.5 text-sm text-zinc-800 hover:bg-amz-light"
              >
                <LogOut className="size-4" /> Çıkış yap
              </button>
            </>
          ) : (
            <div className="p-4">
              <Link href="/login" onClick={() => setOpen(false)} className="btn-amz w-full">
                Giriş yap
              </Link>
              <p className="mt-3 text-center text-xs text-zinc-600">
                Yeni müşteri misiniz?{" "}
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="text-amz-link hover:text-amz-link-hover"
                >
                  Hesap oluşturun
                </Link>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
