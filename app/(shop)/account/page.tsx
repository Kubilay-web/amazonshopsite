import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, LayoutDashboard, MapPin, Package, UserCog } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const metadata: Metadata = { title: "Hesabım" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/account");

  const [orderCount, addressCount, wishlistCount] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.address.count({ where: { userId: user.id } }),
    prisma.wishlist.count({ where: { userId: user.id } }),
  ]);

  const cards = [
    {
      href: "/account/orders",
      icon: Package,
      title: "Siparişlerim",
      description: `${orderCount} sipariş · takip et, iade et veya tekrar satın al`,
    },
    {
      href: "/account/addresses",
      icon: MapPin,
      title: "Adreslerim",
      description: `${addressCount} kayıtlı adres · düzenle veya yeni ekle`,
    },
    {
      href: "/account/profile",
      icon: UserCog,
      title: "Giriş ve güvenlik",
      description: "Ad, e-posta ve şifre bilgilerinizi yönetin",
    },
    {
      href: "/wishlist",
      icon: Heart,
      title: "Favorilerim",
      description: `${wishlistCount} ürün kaydedildi`,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-3 py-6">
      <h1 className="mb-5 text-2xl font-bold text-zinc-900 sm:text-3xl">Hesabım</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex gap-4 rounded-lg border border-amz-border bg-white p-4 transition hover:shadow-md"
          >
            <card.icon className="size-9 shrink-0 text-amz-nav" strokeWidth={1.5} />
            <div>
              <h2 className="text-base font-bold text-zinc-900">{card.title}</h2>
              <p className="text-sm text-zinc-600">{card.description}</p>
            </div>
          </Link>
        ))}

        {user.role === "ADMIN" && (
          <Link
            href="/admin"
            className="flex gap-4 rounded-lg border border-amz-orange bg-amber-50 p-4 transition hover:shadow-md sm:col-span-2"
          >
            <LayoutDashboard className="size-9 shrink-0 text-amz-orange" strokeWidth={1.5} />
            <div>
              <h2 className="text-base font-bold text-zinc-900">Yönetim Paneli</h2>
              <p className="text-sm text-zinc-600">
                Ürün, kategori, sipariş, kullanıcı ve kuponları yönetin
              </p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
