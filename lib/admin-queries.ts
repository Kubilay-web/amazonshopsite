import "server-only";
import prisma from "@/lib/prisma";
import { round2 } from "@/lib/utils";

const DAY = 24 * 60 * 60 * 1000;

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** [start, end) aralığındaki her gün için sıfırla başlatılmış seri üretir. */
function emptySeries(days: number, end: Date) {
  const series = new Map<string, { date: string; revenue: number; orders: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const key = dayKey(new Date(end.getTime() - i * DAY));
    series.set(key, { date: key, revenue: 0, orders: 0 });
  }
  return series;
}

export type RangeKey = "7" | "30" | "90" | "365";

export const RANGE_LABELS: Record<RangeKey, string> = {
  "7": "Son 7 gün",
  "30": "Son 30 gün",
  "90": "Son 90 gün",
  "365": "Son 1 yıl",
};

export function parseRange(value: unknown): RangeKey {
  return value === "7" || value === "90" || value === "365" ? value : "30";
}

/**
 * Panodaki üst kartlar + uyarılar. Tek turda paralel sorgu yapar.
 * `lowStockThreshold` site ayarlarından gelir.
 */
export async function getAdminOverview(lowStockThreshold = 5) {
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * DAY);
  const prevMonthStart = new Date(now.getTime() - 60 * DAY);

  const [
    productCount,
    activeProducts,
    userCount,
    orderCount,
    reviewCount,
    couponCount,
    categoryCount,
    bannerCount,
    pendingOrders,
    unpaidOrders,
    shippedOrders,
    lowStock,
    outOfStock,
    newUsers30,
    paidAgg,
    monthOrders,
    prevMonthOrders,
    recentOrders,
    recentReviews,
    lowStockProducts,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count(),
    prisma.order.count(),
    prisma.review.count(),
    prisma.coupon.count({ where: { active: true } }),
    prisma.category.count(),
    prisma.banner.count({ where: { active: true } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { paymentStatus: "UNPAID", status: { not: "CANCELLED" } } }),
    prisma.order.count({ where: { status: "SHIPPED" } }),
    prisma.product.count({ where: { stock: { lte: lowStockThreshold, gt: 0 } } }),
    prisma.product.count({ where: { stock: { lte: 0 } } }),
    prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.order.aggregate({
      where: { isPaid: true },
      _sum: { totalPrice: true },
      _count: { _all: true },
    }),
    prisma.order.findMany({
      where: { isPaid: true, createdAt: { gte: monthAgo } },
      select: { totalPrice: true, createdAt: true },
    }),
    prisma.order.aggregate({
      where: { isPaid: true, createdAt: { gte: prevMonthStart, lt: monthAgo } },
      _sum: { totalPrice: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { name: true } },
        product: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.product.findMany({
      where: { stock: { lte: lowStockThreshold } },
      orderBy: { stock: "asc" },
      take: 6,
      select: { id: true, title: true, stock: true, images: true },
    }),
  ]);

  const revenue = round2(paidAgg._sum.totalPrice ?? 0);
  const monthRevenue = round2(monthOrders.reduce((sum, o) => sum + o.totalPrice, 0));
  const prevRevenue = round2(prevMonthOrders._sum.totalPrice ?? 0);
  const growth = prevRevenue > 0 ? round2(((monthRevenue - prevRevenue) / prevRevenue) * 100) : null;
  const avgOrderValue = paidAgg._count._all > 0 ? round2(revenue / paidAgg._count._all) : 0;

  const series = emptySeries(14, now);
  for (const order of monthOrders) {
    const bucket = series.get(dayKey(order.createdAt));
    if (bucket) {
      bucket.revenue = round2(bucket.revenue + order.totalPrice);
      bucket.orders += 1;
    }
  }

  return {
    productCount,
    activeProducts,
    userCount,
    orderCount,
    reviewCount,
    couponCount,
    categoryCount,
    bannerCount,
    pendingOrders,
    unpaidOrders,
    shippedOrders,
    lowStock,
    outOfStock,
    newUsers30,
    revenue,
    monthRevenue,
    growth,
    avgOrderValue,
    paidOrderCount: paidAgg._count._all,
    days: [...series.values()],
    recentOrders,
    recentReviews,
    lowStockProducts,
  };
}

export type TopProduct = {
  productId: string;
  title: string;
  slug: string;
  image: string;
  qty: number;
  revenue: number;
};

/** Raporlar ekranı: seçilen aralık için satış analizi. */
export async function getSalesReport(range: RangeKey) {
  const days = Number(range);
  const now = new Date();
  const since = new Date(now.getTime() - (days - 1) * DAY);
  since.setHours(0, 0, 0, 0);

  const [orders, statusCounts, paymentCounts, newUsers, coupons] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: {
        id: true,
        userId: true,
        items: true,
        totalPrice: true,
        itemsPrice: true,
        shippingPrice: true,
        discount: true,
        couponCode: true,
        isPaid: true,
        paymentMethod: true,
        createdAt: true,
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.order.groupBy({
      by: ["paymentStatus"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      _sum: { totalPrice: true },
    }),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.coupon.findMany({
      where: { usedCount: { gt: 0 } },
      orderBy: { usedCount: "desc" },
      take: 8,
      select: { code: true, discountPercent: true, usedCount: true, maxUses: true },
    }),
  ]);

  const paid = orders.filter((o) => o.isPaid);

  // Günlük seri
  const series = emptySeries(days, now);
  for (const order of paid) {
    const bucket = series.get(dayKey(order.createdAt));
    if (bucket) {
      bucket.revenue = round2(bucket.revenue + order.totalPrice);
      bucket.orders += 1;
    }
  }

  // Ürün kırılımı (OrderItem gömülü tip olduğu için bellekte toplanır)
  const productMap = new Map<string, TopProduct>();
  let unitsSold = 0;
  for (const order of paid) {
    for (const item of order.items) {
      unitsSold += item.qty;
      const current = productMap.get(item.productId);
      if (current) {
        current.qty += item.qty;
        current.revenue = round2(current.revenue + item.price * item.qty);
      } else {
        productMap.set(item.productId, {
          productId: item.productId,
          title: item.title,
          slug: item.slug,
          image: item.image,
          qty: item.qty,
          revenue: round2(item.price * item.qty),
        });
      }
    }
  }
  const topProducts = [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Müşteri kırılımı
  const customerMap = new Map<string, { userId: string; orders: number; revenue: number }>();
  for (const order of paid) {
    const current = customerMap.get(order.userId);
    if (current) {
      current.orders += 1;
      current.revenue = round2(current.revenue + order.totalPrice);
    } else {
      customerMap.set(order.userId, { userId: order.userId, orders: 1, revenue: order.totalPrice });
    }
  }
  const topCustomerIds = [...customerMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  const customerRows = topCustomerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: topCustomerIds.map((c) => c.userId) } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const customerById = new Map(customerRows.map((u) => [u.id, u]));
  const topCustomers = topCustomerIds.map((c) => ({
    ...c,
    name: customerById.get(c.userId)?.name ?? "Silinmiş kullanıcı",
    email: customerById.get(c.userId)?.email ?? "—",
    revenue: round2(c.revenue),
  }));

  // Kategori kırılımı — satılan ürünlerin kategorilerini tek sorguda çek
  const productIds = [...productMap.keys()];
  const productCategories = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, category: { select: { id: true, name: true } } },
      })
    : [];
  const categoryOf = new Map(productCategories.map((p) => [p.id, p.category]));
  const categoryMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const product of productMap.values()) {
    const category = categoryOf.get(product.productId);
    const key = category?.id ?? "unknown";
    const name = category?.name ?? "Silinmiş kategori";
    const current = categoryMap.get(key);
    if (current) {
      current.qty += product.qty;
      current.revenue = round2(current.revenue + product.revenue);
    } else {
      categoryMap.set(key, { name, qty: product.qty, revenue: product.revenue });
    }
  }
  const categoryBreakdown = [...categoryMap.values()].sort((a, b) => b.revenue - a.revenue);

  const revenue = round2(paid.reduce((s, o) => s + o.totalPrice, 0));
  const shippingRevenue = round2(paid.reduce((s, o) => s + o.shippingPrice, 0));
  const discountTotal = round2(paid.reduce((s, o) => s + o.discount, 0));
  const codOrders = paid.filter((o) => o.paymentMethod === "cod").length;

  return {
    range,
    days: [...series.values()],
    revenue,
    shippingRevenue,
    discountTotal,
    orderCount: orders.length,
    paidCount: paid.length,
    unitsSold,
    newUsers,
    avgOrderValue: paid.length ? round2(revenue / paid.length) : 0,
    conversion: orders.length ? round2((paid.length / orders.length) * 100) : 0,
    codOrders,
    stripeOrders: paid.length - codOrders,
    statusCounts: statusCounts.map((s) => ({ status: s.status, count: s._count._all })),
    paymentCounts: paymentCounts.map((p) => ({
      status: p.paymentStatus,
      count: p._count._all,
      total: round2(p._sum.totalPrice ?? 0),
    })),
    topProducts,
    topCustomers,
    categoryBreakdown,
    coupons,
  };
}

/** Tek müşterinin 360° görünümü. */
export async function getCustomerDetail(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      phone: true,
      blocked: true,
      createdAt: true,
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
      cart: { select: { items: true, updatedAt: true } },
    },
  });
  if (!user) return null;

  const [orders, reviews, wishlist, paidAgg] = await Promise.all([
    prisma.order.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        orderNumber: true,
        totalPrice: true,
        status: true,
        paymentStatus: true,
        isPaid: true,
        items: true,
        createdAt: true,
      },
    }),
    prisma.review.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { product: { select: { id: true, title: true, slug: true } } },
    }),
    prisma.wishlist.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { product: { select: { id: true, title: true, slug: true, images: true } } },
    }),
    prisma.order.aggregate({
      where: { userId: id, isPaid: true },
      _sum: { totalPrice: true },
      _count: { _all: true },
    }),
  ]);

  const spent = round2(paidAgg._sum.totalPrice ?? 0);

  return {
    user,
    orders,
    reviews,
    wishlist,
    stats: {
      spent,
      paidOrders: paidAgg._count._all,
      totalOrders: orders.length,
      avgOrder: paidAgg._count._all ? round2(spent / paidAgg._count._all) : 0,
      cartItems: user.cart?.items.length ?? 0,
    },
  };
}
