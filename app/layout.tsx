import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { getSettings, toShopConfig } from "@/lib/settings";
import { Providers } from "@/components/providers";
import { SiteAnalytics } from "@/components/analytics/site-analytics";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const FALLBACK_DESCRIPTION =
  "Elektronikten modaya, ev ürünlerinden kitaplara milyonlarca ürün. Hızlı teslimat, güvenli ödeme.";

/** Sekme başlığı ve açıklama, yönetim panelindeki Ayarlar ekranından gelir. */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    title: {
      default: `${settings.siteName} — Online Alışveriş`,
      template: `%s | ${settings.siteName}`,
    },
    description: settings.siteDescription || FALLBACK_DESCRIPTION,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#131921",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);

  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-amz-light">
        <Providers user={user} config={toShopConfig(settings)}>
          {children}
        </Providers>
        <SiteAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      </body>
    </html>
  );
}
