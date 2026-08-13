import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "İsim en az 2 karakter olmalı").max(60),
  email: z.string().trim().toLowerCase().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Geçerli bir e-posta girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı").max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "E-posta gerekli"),
  password: z.string().min(1, "Şifre gerekli"),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(60),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  image: z.string().trim().optional().or(z.literal("")),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifre gerekli"),
  newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalı").max(72),
});

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Ad soyad gerekli"),
  phone: z.string().trim().min(7, "Telefon gerekli"),
  addressLine1: z.string().trim().min(5, "Adres gerekli"),
  addressLine2: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().min(2, "Şehir gerekli"),
  state: z.string().trim().min(1, "İlçe gerekli"),
  postalCode: z.string().trim().min(3, "Posta kodu gerekli"),
  country: z.string().trim().min(2).default("Türkiye"),
  isDefault: z.boolean().optional().default(false),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Kategori adı gerekli").max(60),
  slug: z.string().trim().optional().or(z.literal("")),
  image: z.string().trim().optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0),
});

export const subCategorySchema = z.object({
  name: z.string().trim().min(2, "Alt kategori adı gerekli").max(60),
  slug: z.string().trim().optional().or(z.literal("")),
  image: z.string().trim().optional().or(z.literal("")),
  categoryId: z.string().length(24, "Kategori seçin"),
});

export const productColorSchema = z.object({
  name: z.string().trim().min(1),
  hex: z.string().trim().min(3),
});

export const productSchema = z.object({
  title: z.string().trim().min(3, "Ürün adı en az 3 karakter").max(160),
  slug: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().min(10, "Açıklama en az 10 karakter"),
  details: z.string().trim().optional().or(z.literal("")),
  brand: z.string().trim().optional().or(z.literal("")),
  sku: z.string().trim().optional().or(z.literal("")),
  images: z.array(z.string().min(1)).min(1, "En az 1 görsel gerekli"),
  price: z.coerce.number().min(0.01, "Fiyat gerekli"),
  discountPercent: z.coerce.number().int().min(0).max(95).default(0),
  stock: z.coerce.number().int().min(0).default(0),
  colors: z.array(productColorSchema).default([]),
  sizes: z.array(z.string().trim().min(1)).default([]),
  tags: z.array(z.string().trim().min(1)).default([]),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  shippingFree: z.boolean().default(false),
  categoryId: z.string().length(24, "Kategori seçin"),
  subCategoryId: z.string().length(24).optional().nullable().or(z.literal("")),
});

export const reviewSchema = z.object({
  productId: z.string().length(24),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  comment: z.string().trim().min(3, "Yorum en az 3 karakter").max(2000),
});

export const cartItemSchema = z.object({
  productId: z.string().length(24),
  qty: z.coerce.number().int().min(1).max(99),
  size: z.string().trim().optional().nullable(),
  color: z.string().trim().optional().nullable(),
});

export const cartSyncSchema = z.object({
  items: z.array(cartItemSchema).max(100),
});

export const couponSchema = z.object({
  code: z.string().trim().toUpperCase().min(3, "Kupon kodu gerekli").max(30),
  discountPercent: z.coerce.number().int().min(1).max(90),
  minAmount: z.coerce.number().min(0).default(0),
  maxUses: z.coerce.number().int().min(0).default(0),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  active: z.boolean().default(true),
});

export const bannerSchema = z.object({
  title: z.string().trim().min(2, "Başlık gerekli"),
  subtitle: z.string().trim().optional().or(z.literal("")),
  image: z.string().trim().min(1, "Görsel gerekli"),
  link: z.string().trim().default("/"),
  position: z.enum(["HERO", "STRIP"]).default("HERO"),
  order: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export const checkoutSchema = z.object({
  addressId: z.string().length(24).optional().nullable(),
  shippingAddress: z
    .object({
      fullName: z.string().trim().min(2),
      phone: z.string().trim().min(7),
      addressLine1: z.string().trim().min(5),
      addressLine2: z.string().trim().optional().or(z.literal("")),
      city: z.string().trim().min(2),
      state: z.string().trim().min(1),
      postalCode: z.string().trim().min(3),
      country: z.string().trim().min(2),
    })
    .optional()
    .nullable(),
  paymentMethod: z.enum(["stripe", "cod"]),
  couponCode: z.string().trim().optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export const orderStatusSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
  paymentStatus: z.enum(["UNPAID", "PAID", "REFUNDED", "FAILED"]).optional(),
  trackingNumber: z.string().trim().optional().or(z.literal("")),
});

const optionalText = z.string().trim().max(300).optional().or(z.literal(""));

export const settingsSchema = z.object({
  siteName: z.string().trim().min(1, "Site adı gerekli").max(60),
  siteDescription: z.string().trim().max(300).optional().or(z.literal("")),
  supportEmail: optionalText,
  supportPhone: optionalText,
  contactAddress: z.string().trim().max(500).optional().or(z.literal("")),

  announcement: z.string().trim().max(200).optional().or(z.literal("")),
  announcementLink: optionalText,
  announcementActive: z.boolean().default(false),

  freeShippingLimit: z.coerce.number().min(0).max(100000),
  shippingCost: z.coerce.number().min(0).max(10000),
  taxRate: z.coerce.number().min(0).max(100),
  minOrderAmount: z.coerce.number().min(0).max(100000),
  lowStockThreshold: z.coerce.number().int().min(0).max(1000),

  codEnabled: z.boolean().default(true),
  stripeEnabled: z.boolean().default(true),
  reviewsEnabled: z.boolean().default(true),
  registrationOpen: z.boolean().default(true),

  maintenanceMode: z.boolean().default(false),
  maintenanceMessage: z.string().trim().max(300).optional().or(z.literal("")),

  facebook: optionalText,
  instagram: optionalText,
  twitter: optionalText,
  youtube: optionalText,
});

export const productBulkSchema = z.object({
  ids: z.array(z.string().length(24)).min(1, "En az bir ürün seçin").max(500),
  action: z.enum([
    "activate",
    "deactivate",
    "feature",
    "unfeature",
    "discount",
    "stock",
    "category",
    "delete",
  ]),
  discountPercent: z.coerce.number().int().min(0).max(95).optional(),
  stock: z.coerce.number().int().min(0).max(1000000).optional(),
  categoryId: z.string().length(24).optional(),
});

export const inventoryUpdateSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string().length(24),
        stock: z.coerce.number().int().min(0).max(1000000).optional(),
        price: z.coerce.number().min(0.01).max(1000000).optional(),
        discountPercent: z.coerce.number().int().min(0).max(95).optional(),
      }),
    )
    .min(1, "Değişiklik yok")
    .max(200),
});

export const orderBulkSchema = z.object({
  ids: z.array(z.string().length(24)).min(1, "En az bir sipariş seçin").max(200),
  status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
  paymentStatus: z.enum(["UNPAID", "PAID", "REFUNDED", "FAILED"]).optional(),
});

/** Zod hatalarını { alan: mesaj } sözlüğüne çevirir. */
export function zodErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
