"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Menu, X } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

type Category = {
  id: string;
  name: string;
  slug: string;
  subCategories: { id: string; name: string; slug: string }[];
};

export function MobileMenu({ categories }: { categories: Category[] }) {
  const user = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-sm px-2 py-1.5 text-sm font-bold text-white hover:bg-amz-nav-hover"
        aria-label="Menüyü aç"
      >
        <Menu className="size-5" />
        <span className="hidden sm:inline">Tümü</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-90 flex">
          <button
            type="button"
            aria-label="Menüyü kapat"
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <aside className="animate-fade-in relative flex h-full w-[85%] max-w-sm flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between bg-amz-nav px-4 py-3 text-white">
              <p className="text-base font-bold">
                Merhaba, {user ? user.name.split(" ")[0] : "Giriş yapın"}
              </p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Kapat">
                <X className="size-6" />
              </button>
            </div>

            <nav className="flex-1 py-2 text-[15px] text-zinc-800">
              <p className="px-4 pb-1 pt-3 text-base font-bold text-zinc-900">
                Kategoriler
              </p>
              {categories.map((category) => (
                <div key={category.id} className="border-b border-zinc-100 last:border-0">
                  <Link
                    href={`/category/${category.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-amz-light"
                  >
                    {category.name}
                    <ChevronRight className="size-4 text-zinc-400" />
                  </Link>
                  {category.subCategories.length > 0 && (
                    <div className="pb-2">
                      {category.subCategories.slice(0, 6).map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/category/${category.slug}?subCategory=${sub.slug}`}
                          onClick={() => setOpen(false)}
                          className="block px-8 py-2 text-sm text-zinc-600 hover:bg-amz-light"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <p className="px-4 pb-1 pt-4 text-base font-bold text-zinc-900">Hesabım</p>
              {user ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-amz-light"
                  >
                    Hesap bilgilerim
                  </Link>
                  <Link
                    href="/account/orders"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-amz-light"
                  >
                    Siparişlerim
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-amz-light"
                  >
                    Favorilerim
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 font-medium text-amz-link hover:bg-amz-light"
                    >
                      Yönetim Paneli
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-amz-light"
                  >
                    Giriş yap
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-amz-light"
                  >
                    Hesap oluştur
                  </Link>
                </>
              )}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
