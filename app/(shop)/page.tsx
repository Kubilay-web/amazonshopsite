import Link from "next/link";
import { getHomeData } from "@/lib/queries";
import { HeroCarousel, type Slide } from "@/components/home/hero-carousel";
import { ProductRow } from "@/components/product/product-row";
import { SafeImage } from "@/components/ui/safe-image";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

const DEFAULT_SLIDES: Slide[] = [
  {
    id: "d1",
    title: "Yeni sezon fırsatları",
    subtitle: "Binlerce üründe kaçırılmayacak indirimler",
    image:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=80",
    link: "/search?discounted=true",
  },
  {
    id: "d2",
    title: "Teknolojide büyük indirim",
    subtitle: "Telefon, bilgisayar ve aksesuarlarda avantajlı fiyatlar",
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1600&q=80",
    link: "/search?sort=discount",
  },
  {
    id: "d3",
    title: "Evini yenile",
    subtitle: "Mobilya ve dekorasyon ürünlerinde ücretsiz kargo",
    image:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1600&q=80",
    link: "/search",
  },
];

export default async function HomePage() {
  const { heroBanners, stripBanners, categories, featured, newest, bestSellers, deals } =
    await getHomeData();

  const slides: Slide[] =
    heroBanners.length > 0
      ? heroBanners.map((b) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          image: b.image,
          link: b.link,
        }))
      : DEFAULT_SLIDES;

  const hasProducts =
    featured.length + newest.length + bestSellers.length + deals.length > 0;

  return (
    <div className="pb-10">
      <HeroCarousel slides={slides} />

      <div className="mx-auto -mt-6 max-w-[1500px] space-y-4 px-2 sm:-mt-10 sm:px-4">
        {/* Kategori kartları */}
        {categories.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group rounded-lg bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <h2 className="mb-2 text-base font-bold text-zinc-900 sm:text-lg">
                  {category.name}
                </h2>
                <div className="relative aspect-4/3 w-full overflow-hidden rounded">
                  <SafeImage
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <span className="mt-2 inline-block text-sm text-amz-link group-hover:text-amz-link-hover">
                  Alışverişe başla
                </span>
              </Link>
            ))}
          </div>
        )}

        {!hasProducts && (
          <EmptyState
            title="Henüz ürün eklenmemiş"
            description="Yönetim panelinden ürün ekleyin veya örnek verileri yüklemek için `npm run db:seed` komutunu çalıştırın."
            actionLabel="Yönetim paneline git"
            actionHref="/admin"
          />
        )}

        <ProductRow title="Fırsat ürünleri" products={deals} href="/search?discounted=true" />
        <ProductRow title="Öne çıkanlar" products={featured} href="/search?featured=true" />
        <ProductRow title="Çok satanlar" products={bestSellers} href="/search?sort=popular" />

        {/* Orta şerit banner */}
        {stripBanners.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {stripBanners.slice(0, 2).map((banner) => (
              <Link
                key={banner.id}
                href={banner.link}
                className="relative block h-40 overflow-hidden rounded-lg sm:h-52"
              >
                <SafeImage
                  src={banner.image}
                  alt={banner.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/35" />
                <div className="absolute inset-0 flex flex-col justify-center px-6 text-white">
                  <h3 className="text-lg font-bold sm:text-2xl">{banner.title}</h3>
                  {banner.subtitle && <p className="text-sm sm:text-base">{banner.subtitle}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}

        <ProductRow title="Yeni gelenler" products={newest} href="/search?sort=newest" />
      </div>
    </div>
  );
}
