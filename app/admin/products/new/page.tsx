import Link from "next/link";
import { getCategories } from "@/lib/queries";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-4">
      <nav className="text-sm text-zinc-600">
        <Link href="/admin/products" className="text-amz-link hover:text-amz-link-hover">
          Ürünler
        </Link>
        <span className="mx-1">›</span>
        <span>Yeni ürün</span>
      </nav>

      <h1 className="text-2xl font-bold text-zinc-900">Yeni ürün ekle</h1>

      {categories.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Önce en az bir kategori oluşturmalısınız.{" "}
          <Link href="/admin/categories" className="font-semibold underline">
            Kategorilere git
          </Link>
        </p>
      ) : (
        <ProductForm
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            subCategories: c.subCategories,
          }))}
        />
      )}
    </div>
  );
}
