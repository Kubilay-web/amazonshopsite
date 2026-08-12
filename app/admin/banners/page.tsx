import prisma from "@/lib/prisma";
import { BannerManager } from "@/components/admin/banner-manager";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const banners = await prisma.banner.findMany({
    orderBy: [{ position: "asc" }, { order: "asc" }],
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Bannerlar</h1>
        <p className="text-sm text-zinc-600">
          Ana sayfa slaytları ve orta şerit görselleri
        </p>
      </div>

      <BannerManager banners={banners} />
    </div>
  );
}
