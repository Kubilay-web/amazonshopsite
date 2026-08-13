import type { Metadata } from "next";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: "Yönetim Paneli" };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/admin");
  if (user.role !== "ADMIN") redirect("/");

  const settings = await getSettings();

  // Kenar çubuğundaki uyarı rozetleri
  const [pendingOrders, lowStock, reviews] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.product.count({ where: { stock: { lte: settings.lowStockThreshold } } }),
    prisma.review.count({ where: { rating: { lte: 2 } } }),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 lg:flex-row">
      <AdminNav
        userName={user.name}
        badges={{ pendingOrders, lowStock, reviews }}
        maintenanceMode={settings.maintenanceMode}
      />
      <main className="min-w-0 flex-1 p-3 sm:p-5">{children}</main>
    </div>
  );
}
