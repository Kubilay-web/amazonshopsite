import prisma from "@/lib/prisma";
import { CategoryManager } from "@/components/admin/category-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true } },
      subCategories: {
        orderBy: { name: "asc" },
        include: { _count: { select: { products: true } } },
      },
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Kategoriler</h1>
        <p className="text-sm text-zinc-600">
          {categories.length} kategori ·{" "}
          {categories.reduce((s, c) => s + c.subCategories.length, 0)} alt kategori
        </p>
      </div>

      <CategoryManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          image: c.image,
          order: c.order,
          _count: c._count,
          subCategories: c.subCategories.map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            _count: s._count,
          })),
        }))}
      />
    </div>
  );
}
