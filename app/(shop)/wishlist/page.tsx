import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getWishlist } from "@/lib/queries";
import { ProductGrid } from "@/components/product/product-grid";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Favorilerim" };
export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/wishlist");

  const items = await getWishlist(user.id);
  const products = items.map((i) => i.product);

  return (
    <div className="mx-auto max-w-[1500px] px-2 py-4 sm:px-4">
      <div className="mb-4 rounded-lg bg-white p-4">
        <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-900 sm:text-2xl">
          <Heart className="size-6 fill-amz-price text-amz-price" /> Favorilerim
        </h1>
        <p className="text-sm text-zinc-600">{products.length} ürün</p>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-14" />}
          title="Favori listeniz boş"
          description="Beğendiğiniz ürünleri kalp simgesine tıklayarak buraya ekleyebilirsiniz."
          actionLabel="Ürünlere göz at"
          actionHref="/search"
        />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
