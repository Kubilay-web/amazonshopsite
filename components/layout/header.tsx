import Link from "next/link";
import { Suspense } from "react";
import { MapPin } from "lucide-react";
import { getCategories } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { SearchBar } from "@/components/layout/search-bar";
import { CartButton } from "@/components/layout/cart-button";
import { AccountMenu } from "@/components/layout/account-menu";
import { MobileMenu } from "@/components/layout/mobile-menu";

export async function Header() {
  const [categories, settings] = await Promise.all([getCategories(), getSettings()]);
  const flat = categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
  const showAnnouncement = settings.announcementActive && settings.announcement.trim().length > 0;

  return (
    <header className="sticky top-0 z-50">
      {/* Duyuru şeridi — yönetim panelindeki Ayarlar ekranından yönetilir */}
      {showAnnouncement && (
        <Link
          href={settings.announcementLink || "/"}
          className="block bg-amz-orange px-3 py-1.5 text-center text-sm font-medium text-zinc-900 hover:brightness-97"
        >
          {settings.announcement}
        </Link>
      )}

      {/* Üst şerit */}
      <div className="bg-amz-dark text-white">
        <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-2 py-2 sm:gap-3 sm:px-4">
          <Link
            href="/"
            className="flex shrink-0 items-end rounded-sm border border-transparent px-1.5 py-1 hover:border-white"
          >
            <span className="text-xl font-bold tracking-tight sm:text-2xl">
              {settings.siteName}
            </span>
            <span className="mb-1 ml-0.5 h-1.5 w-4 rounded-full bg-amz-orange" />
          </Link>

          <Link
            href="/account/addresses"
            className="hidden shrink-0 items-center gap-1 rounded-sm border border-transparent px-1.5 py-1 hover:border-white lg:flex"
          >
            <MapPin className="size-5" />
            <span className="leading-tight">
              <span className="block text-[11px] text-zinc-300">Teslimat adresi</span>
              <span className="block text-sm font-bold">Adres seçin</span>
            </span>
          </Link>

          <div className="min-w-0 flex-1">
            <Suspense fallback={<div className="h-10 rounded-md bg-white/10" />}>
              <SearchBar categories={flat} />
            </Suspense>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <AccountMenu />
            <Link
              href="/account/orders"
              className="hidden rounded-sm border border-transparent px-2 py-1 leading-tight text-white hover:border-white lg:block"
            >
              <span className="block text-[11px]">İadeler</span>
              <span className="block text-sm font-bold">&amp; Siparişler</span>
            </Link>
            <CartButton />
          </div>
        </div>
      </div>

      {/* Kategori şeridi */}
      <div className="bg-amz-nav text-white">
        <div className="scrollbar-hide mx-auto flex max-w-[1500px] items-center gap-1 overflow-x-auto px-2 py-1 text-sm sm:px-4">
          <MobileMenu categories={categories} />
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="shrink-0 whitespace-nowrap rounded-sm border border-transparent px-2 py-1.5 hover:border-white"
            >
              {category.name}
            </Link>
          ))}
          <Link
            href="/search?discounted=true"
            className="shrink-0 whitespace-nowrap rounded-sm border border-transparent px-2 py-1.5 font-medium text-amz-yellow hover:border-white"
          >
            Fırsatlar
          </Link>
        </div>
      </div>
    </header>
  );
}
