"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Boxes,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  ScrollText,
  Settings,
  ShoppingBag,
  Store,
  Tag,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badge?: number;
};

const GROUPS: { title: string; links: NavLink[] }[] = [
  {
    title: "Genel",
    links: [
      { href: "/admin", label: "Panel", icon: LayoutDashboard, exact: true },
      { href: "/admin/reports", label: "Raporlar", icon: BarChart3 },
    ],
  },
  {
    title: "Katalog",
    links: [
      { href: "/admin/products", label: "Ürünler", icon: Package },
      { href: "/admin/inventory", label: "Stok & fiyat", icon: Boxes },
      { href: "/admin/categories", label: "Kategoriler", icon: Tag },
      { href: "/admin/reviews", label: "Yorumlar", icon: MessageSquare },
    ],
  },
  {
    title: "Satış",
    links: [
      { href: "/admin/orders", label: "Siparişler", icon: ShoppingBag },
      { href: "/admin/coupons", label: "Kuponlar", icon: Ticket },
    ],
  },
  {
    title: "Müşteri & içerik",
    links: [
      { href: "/admin/users", label: "Kullanıcılar", icon: Users },
      { href: "/admin/banners", label: "Bannerlar", icon: ImageIcon },
    ],
  },
  {
    title: "Sistem",
    links: [
      { href: "/admin/settings", label: "Ayarlar", icon: Settings },
      { href: "/admin/logs", label: "İşlem kaydı", icon: ScrollText },
    ],
  },
];

export type AdminNavBadges = {
  pendingOrders?: number;
  lowStock?: number;
  reviews?: number;
};

export function AdminNav({
  userName,
  badges = {},
  maintenanceMode = false,
}: {
  userName: string;
  badges?: AdminNavBadges;
  maintenanceMode?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function badgeFor(href: string) {
    if (href === "/admin/orders") return badges.pendingOrders;
    if (href === "/admin/inventory") return badges.lowStock;
    if (href === "/admin/reviews") return badges.reviews;
    return undefined;
  }

  const nav = (
    <nav className="flex flex-col gap-4">
      {GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            {group.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.links.map((link) => {
              const active = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href);
              const badge = badgeFor(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                    active
                      ? "bg-amz-orange font-semibold text-zinc-900"
                      : "text-zinc-200 hover:bg-amz-nav-hover",
                  )}
                >
                  <link.icon className="size-4.5 shrink-0" />
                  <span className="flex-1 truncate">{link.label}</span>
                  {badge != null && badge > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        active ? "bg-zinc-900 text-white" : "bg-rose-500 text-white",
                      )}
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="mt-auto space-y-1 border-t border-white/10 pt-3">
      {maintenanceMode && (
        <Link
          href="/admin/settings"
          className="mb-2 block rounded-md bg-rose-500/20 px-3 py-2 text-xs font-medium text-rose-200 hover:bg-rose-500/30"
        >
          ⚠ Bakım modu açık — mağaza kapalı
        </Link>
      )}
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
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto bg-amz-dark p-4 lg:flex">
        <Link href="/admin" className="mb-5 flex items-end px-1">
          <span className="text-xl font-bold text-white">amazon</span>
          <span className="mb-1 ml-0.5 h-1.5 w-4 rounded-full bg-amz-orange" />
          <span className="ml-2 text-xs text-zinc-400">admin</span>
        </Link>

        {nav}
        {footer}
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
          <div className="animate-fade-in relative flex h-full w-64 flex-col overflow-y-auto bg-amz-dark p-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 text-white"
              aria-label="Kapat"
            >
              <X className="size-5" />
            </button>
            <span className="mb-5 mt-1 text-lg font-bold text-white">Yönetim</span>
            {nav}
            {footer}
          </div>
        </div>
      )}
    </>
  );
}
