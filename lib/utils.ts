import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const priceFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

export function formatPrice(value: number) {
  return priceFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/** İndirim uygulanmış birim fiyat */
export function finalPrice(price: number, discountPercent = 0) {
  const p = price - (price * (discountPercent || 0)) / 100;
  return Math.round(p * 100) / 100;
}

export function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const trMap: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

export function slugify(input: string) {
  return input
    .split("")
    .map((ch) => trMap[ch] ?? ch)
    .join("")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function generateOrderNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `AMZ-${stamp}-${rand}`;
}

/** Kargo ücreti: 50 € üzeri bedava */
export const FREE_SHIPPING_LIMIT = 50;
export const SHIPPING_COST = 4.99;
export const TAX_RATE = 0; // KDV fiyatlara dahil

/**
 * Kargo ücreti. `config` verilmezse yukarıdaki varsayılanlar kullanılır;
 * yönetim panelindeki ayarlar bu değerleri istemciye prop olarak taşır.
 */
export function calcShipping(
  itemsPrice: number,
  config?: { freeShippingLimit?: number; shippingCost?: number },
) {
  if (itemsPrice <= 0) return 0;
  const limit = config?.freeShippingLimit ?? FREE_SHIPPING_LIMIT;
  const cost = config?.shippingCost ?? SHIPPING_COST;
  return itemsPrice >= limit ? 0 : cost;
}

/**
 * KDV tutarı. Oran 0 ise (varsayılan) fiyatlara dahil kabul edilir ve
 * siparişe ayrı satır eklenmez.
 */
export function calcTax(amount: number, taxRate = TAX_RATE) {
  if (amount <= 0 || !taxRate) return 0;
  return round2((amount * taxRate) / 100);
}

export function truncate(text: string, length = 90) {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Beklemede",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "İptal Edildi",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Ödenmedi",
  PAID: "Ödendi",
  REFUNDED: "İade Edildi",
  FAILED: "Başarısız",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  PROCESSING: "bg-blue-100 text-blue-800 border-blue-200",
  SHIPPED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-rose-100 text-rose-800 border-rose-200",
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  UNPAID: "bg-zinc-100 text-zinc-700 border-zinc-200",
  PAID: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REFUNDED: "bg-orange-100 text-orange-800 border-orange-200",
  FAILED: "bg-rose-100 text-rose-800 border-rose-200",
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: "Oluşturma",
  UPDATE: "Güncelleme",
  DELETE: "Silme",
  BULK: "Toplu işlem",
  LOGIN: "Giriş",
  SETTINGS: "Ayar",
};

export const AUDIT_ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  UPDATE: "bg-blue-100 text-blue-800 border-blue-200",
  DELETE: "bg-rose-100 text-rose-800 border-rose-200",
  BULK: "bg-violet-100 text-violet-800 border-violet-200",
  LOGIN: "bg-zinc-100 text-zinc-700 border-zinc-200",
  SETTINGS: "bg-amber-100 text-amber-800 border-amber-200",
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  product: "Ürün",
  category: "Kategori",
  subcategory: "Alt kategori",
  order: "Sipariş",
  user: "Kullanıcı",
  review: "Yorum",
  coupon: "Kupon",
  banner: "Banner",
  setting: "Ayarlar",
  inventory: "Stok",
};

export function isValidObjectId(id: string) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Geçerli zaman damgası. Bileşen gövdesinde doğrudan `Date.now()` çağırmak
 * saflık kuralını bozduğu için sunucu bileşenleri bu yardımcıyı kullanır.
 */
export function currentTimestamp() {
  return Date.now();
}
