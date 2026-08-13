import "server-only";
import { cache } from "react";
import prisma from "@/lib/prisma";
import { FREE_SHIPPING_LIMIT, SHIPPING_COST, TAX_RATE, calcTax } from "@/lib/utils";
import type { ShopConfig } from "@/types";

export type { ShopConfig };

export const SETTINGS_KEY = "site";

export type SiteSettings = {
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  supportPhone: string;
  contactAddress: string;
  announcement: string;
  announcementLink: string;
  announcementActive: boolean;
  freeShippingLimit: number;
  shippingCost: number;
  taxRate: number;
  minOrderAmount: number;
  lowStockThreshold: number;
  codEnabled: boolean;
  stripeEnabled: boolean;
  reviewsEnabled: boolean;
  registrationOpen: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
};

/** Veritabanında ayar kaydı yokken kullanılan değerler. */
export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "amazon",
  siteDescription: "Milyonlarca üründe uygun fiyat ve hızlı teslimat.",
  supportEmail: "",
  supportPhone: "",
  contactAddress: "",
  announcement: "",
  announcementLink: "/",
  announcementActive: false,
  freeShippingLimit: FREE_SHIPPING_LIMIT,
  shippingCost: SHIPPING_COST,
  taxRate: TAX_RATE,
  minOrderAmount: 0,
  lowStockThreshold: 5,
  codEnabled: true,
  stripeEnabled: true,
  reviewsEnabled: true,
  registrationOpen: true,
  maintenanceMode: false,
  maintenanceMessage: "Mağazamız kısa bir bakım çalışması nedeniyle geçici olarak kapalı.",
  facebook: "",
  instagram: "",
  twitter: "",
  youtube: "",
};

const FIELDS = Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[];

function normalize(row: Record<string, unknown> | null): SiteSettings {
  if (!row) return { ...DEFAULT_SETTINGS };
  const out = { ...DEFAULT_SETTINGS };
  for (const field of FIELDS) {
    const value = row[field];
    if (value === null || value === undefined) continue;
    // @ts-expect-error — alan tipleri DEFAULT_SETTINGS ile birebir eşleşiyor
    out[field] = value;
  }
  return out;
}

/**
 * Aktif site ayarlarını döner. React `cache` sayesinde aynı istek içinde
 * tek sorgu yapılır. Kayıt henüz oluşmadıysa (ya da DB erişilemezse)
 * varsayılanlara düşer; böylece ayar tablosu olmadan da mağaza çalışır.
 */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const row = await prisma.setting.findUnique({ where: { key: SETTINGS_KEY } });
    return normalize(row as Record<string, unknown> | null);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
});

/** Ayarları yazar; kayıt yoksa oluşturur. */
export async function saveSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
  const row = await prisma.setting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, ...DEFAULT_SETTINGS, ...data },
    update: data,
  });
  return normalize(row as unknown as Record<string, unknown>);
}

/** Ayarlardan türeyen kargo hesabı (sunucu tarafı doğruluk kaynağı). */
export function shippingFor(settings: SiteSettings, itemsPrice: number) {
  if (itemsPrice <= 0) return 0;
  return itemsPrice >= settings.freeShippingLimit ? 0 : settings.shippingCost;
}

/** Ayarlardan türeyen KDV tutarı (indirim düşülmüş tutar üzerinden). */
export function taxFor(settings: SiteSettings, taxableAmount: number) {
  return calcTax(taxableAmount, settings.taxRate);
}

/** İstemci bileşenlerine aktarılan sadeleştirilmiş ticaret yapılandırması. */
export function toShopConfig(settings: SiteSettings): ShopConfig {
  return {
    siteName: settings.siteName,
    freeShippingLimit: settings.freeShippingLimit,
    shippingCost: settings.shippingCost,
    taxRate: settings.taxRate,
    minOrderAmount: settings.minOrderAmount,
    codEnabled: settings.codEnabled,
    stripeEnabled: settings.stripeEnabled,
    reviewsEnabled: settings.reviewsEnabled,
    registrationOpen: settings.registrationOpen,
  };
}
