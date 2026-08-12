import "server-only";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

/** Ürün kartlarında kullanılan minimum alan seti (ağ/DB yükünü düşürür). */
export const productCardSelect = {
  id: true,
  title: true,
  slug: true,
  images: true,
  price: true,
  discountPercent: true,
  rating: true,
  numReviews: true,
  stock: true,
  brand: true,
  shippingFree: true,
} satisfies Prisma.ProductSelect;

export type ProductCard = Prisma.ProductGetPayload<{
  select: typeof productCardSelect;
}>;

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      subCategories: {
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      },
    },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      subCategories: { orderBy: { name: "asc" } },
    },
  });
}

/** Ana sayfa verisi: tek turda paralel sorgular. */
export async function getHomeData() {
  const [heroBanners, stripBanners, categories, featured, newest, bestSellers, deals] =
    await Promise.all([
      prisma.banner.findMany({
        where: { active: true, position: "HERO" },
        orderBy: { order: "asc" },
      }),
      prisma.banner.findMany({
        where: { active: true, position: "STRIP" },
        orderBy: { order: "asc" },
      }),
      prisma.category.findMany({
        orderBy: [{ order: "asc" }, { name: "asc" }],
        take: 8,
        select: { id: true, name: true, slug: true, image: true },
      }),
      prisma.product.findMany({
        where: { isActive: true, featured: true },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: productCardSelect,
      }),
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: productCardSelect,
      }),
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { sold: "desc" },
        take: 12,
        select: productCardSelect,
      }),
      prisma.product.findMany({
        where: { isActive: true, discountPercent: { gt: 0 } },
        orderBy: { discountPercent: "desc" },
        take: 12,
        select: productCardSelect,
      }),
    ]);

  return { heroBanners, stripBanners, categories, featured, newest, bestSellers, deals };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      subCategory: { select: { id: true, name: true, slug: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });
}

export async function getRelatedProducts(categoryId: string, excludeId: string) {
  return prisma.product.findMany({
    where: { categoryId, isActive: true, id: { not: excludeId } },
    take: 12,
    orderBy: { sold: "desc" },
    select: productCardSelect,
  });
}

export type ProductFilters = {
  q?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sort?: string;
  page?: number;
  perPage?: number;
  featured?: boolean;
  discounted?: boolean;
};

function buildOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price-asc":
      return { price: "asc" };
    case "price-desc":
      return { price: "desc" };
    case "rating":
      return { rating: "desc" };
    case "popular":
      return { sold: "desc" };
    case "discount":
      return { discountPercent: "desc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

/** Katalog / arama sorgusu. Filtreler doğrudan Mongo indekslerine düşer. */
export async function searchProducts(filters: ProductFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(60, Math.max(1, filters.perPage ?? 24));

  const where: Prisma.ProductWhereInput = { isActive: true };

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { brand: { contains: filters.q, mode: "insensitive" } },
      { tags: { has: filters.q.toLowerCase() } },
    ];
  }
  if (filters.category) where.category = { slug: filters.category };
  if (filters.subCategory) where.subCategory = { slug: filters.subCategory };
  if (filters.brand) where.brand = { equals: filters.brand, mode: "insensitive" };
  if (filters.featured) where.featured = true;
  if (filters.discounted) where.discountPercent = { gt: 0 };
  if (filters.rating) where.rating = { gte: filters.rating };
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.price = {
      ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
    };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: buildOrderBy(filters.sort),
      skip: (page - 1) * perPage,
      take: perPage,
      select: productCardSelect,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
  };
}

/** Filtre panelinde gösterilecek marka listesi. */
export async function getBrands(categorySlug?: string) {
  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      brand: { not: null },
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    },
    select: { brand: true },
    distinct: ["brand"],
    take: 60,
  });
  return rows.map((r) => r.brand).filter((b): b is string => Boolean(b)).sort();
}

export async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderById(id: string, userId?: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!order) return null;
  if (userId && order.userId !== userId) return null;
  return order;
}

export async function getWishlist(userId: string) {
  return prisma.wishlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { product: { select: productCardSelect } },
  });
}

export async function getUserAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function getCart(userId: string) {
  return prisma.cart.findUnique({ where: { userId } });
}

/** Admin panosu istatistikleri. */
export async function getDashboardStats() {
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    productCount,
    userCount,
    orderCount,
    paidOrders,
    pendingOrders,
    lowStock,
    recentOrders,
    monthlyOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.findMany({
      where: { isPaid: true },
      select: { totalPrice: true, createdAt: true },
    }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.product.count({ where: { stock: { lte: 5 } } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: monthAgo }, isPaid: true },
      select: { totalPrice: true, createdAt: true },
    }),
  ]);

  const revenue = paidOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const monthRevenue = monthlyOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  // Son 14 günün günlük cirosu (grafik için)
  const days: { date: string; total: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const total = monthlyOrders
      .filter((o) => o.createdAt.toISOString().slice(0, 10) === key)
      .reduce((s, o) => s + o.totalPrice, 0);
    days.push({ date: key, total: Math.round(total * 100) / 100 });
  }

  return {
    productCount,
    userCount,
    orderCount,
    revenue,
    monthRevenue,
    pendingOrders,
    lowStock,
    recentOrders,
    days,
  };
}
