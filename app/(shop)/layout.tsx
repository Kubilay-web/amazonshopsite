import Link from "next/link";
import { Wrench } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);
  const isAdmin = user?.role === "ADMIN";

  // Bakım modu: yöneticiler mağazayı görmeye devam eder
  if (settings.maintenanceMode && !isAdmin) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="max-w-md rounded-lg border border-amz-border bg-white p-8 text-center">
          <Wrench className="mx-auto mb-4 size-12 text-amz-orange" />
          <h1 className="mb-2 text-2xl font-bold text-zinc-900">{settings.siteName}</h1>
          <p className="mb-6 text-zinc-600">{settings.maintenanceMessage}</p>
          {settings.supportEmail && (
            <p className="mb-4 text-sm text-zinc-500">
              İletişim:{" "}
              <a
                href={`mailto:${settings.supportEmail}`}
                className="text-amz-link hover:text-amz-link-hover"
              >
                {settings.supportEmail}
              </a>
            </p>
          )}
          <Link href="/login" className="btn-amz-outline">
            Yönetici girişi
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <span id="top" />
      {settings.maintenanceMode && isAdmin && (
        <div className="bg-rose-600 px-3 py-1.5 text-center text-sm font-medium text-white">
          Bakım modu açık — mağazayı yalnızca yöneticiler görüyor.{" "}
          <Link href="/admin/settings" className="underline">
            Ayarlar
          </Link>
        </div>
      )}
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
