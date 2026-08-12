"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  Store,
  Tag,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Ürünler", icon: Package },
  { href: "/admin/categories", label: "Kategoriler", icon: Tag },
  { href: "/admin/orders", label: "Siparişler", icon: ShoppingBag },
  { href: "/admin/users", label: "Kullanıcılar", icon: Users },
  { href: "/admin/coupons", label: "Kuponlar", icon: Ticket },
  { href: "/admin/banners", label: "Bannerlar", icon: ImageIcon },
];

export function AdminNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition",
              active
                ? "bg-amz-orange font-semibold text-zinc-900"
                : "text-zinc-200 hover:bg-amz-nav-hover",
            )}
          >
            <link.icon className="size-4.5" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobil üst çubuk */}
      <div className="sticky top-0 z-50 flex items-center justify-between bg-amz-dark px-3 py-2.5 text-white lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Menü">
          <Menu className="size-6" />
        </button>
        <span className="font-bold">Yönetim Paneli</span>
        <Link href="/" className="text-sm text-amz-yellow">
          Mağaza
        </Link>
      </div>

      {/* Masaüstü kenar çubuğu */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-amz-dark p-4 lg:flex">
        <Link href="/admin" className="mb-6 flex items-end px-1">
          <span className="text-xl font-bold text-white">amazon</span>
          <span className="mb-1 ml-0.5 h-1.5 w-4 rounded-full bg-amz-orange" />
          <span className="ml-2 text-xs text-zinc-400">admin</span>
        </Link>

        {nav}

        <div className="mt-auto space-y-1 border-t border-white/10 pt-3">
          <p className="px-3 text-xs text-zinc-400">Giriş: {userName}</p>
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-200 hover:bg-amz-nav-hover"
          >
            <Store className="size-4.5" /> Mağazaya dön
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-200 hover:bg-amz-nav-hover"
          >
            <LogOut className="size-4.5" /> Çıkış yap
          </button>
        </div>
      </aside>

      {/* Mobil çekmece */}
      {open && (
        <div className="fixed inset-0 z-90 flex lg:hidden">
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="animate-fade-in relative flex h-full w-64 flex-col bg-amz-dark p-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 text-white"
              aria-label="Kapat"
            >
              <X className="size-5" />
            </button>
            <span className="mb-6 mt-1 text-lg font-bold text-white">Yönetim</span>
            {nav}
            <div className="mt-auto space-y-1 border-t border-white/10 pt-3">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-200"
              >
                <Store className="size-4.5" /> Mağazaya dön
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-200"
              >
                <LogOut className="size-4.5" /> Çıkış yap
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
