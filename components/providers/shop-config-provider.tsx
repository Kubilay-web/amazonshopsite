"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ShopConfig } from "@/types";
import { FREE_SHIPPING_LIMIT, SHIPPING_COST, TAX_RATE } from "@/lib/utils";

const FALLBACK: ShopConfig = {
  siteName: "amazon",
  freeShippingLimit: FREE_SHIPPING_LIMIT,
  shippingCost: SHIPPING_COST,
  taxRate: TAX_RATE,
  minOrderAmount: 0,
  codEnabled: true,
  stripeEnabled: true,
  reviewsEnabled: true,
  registrationOpen: true,
};

const ShopConfigContext = createContext<ShopConfig>(FALLBACK);

/**
 * Yönetim panelindeki ayarları istemci bileşenlerine taşır.
 * Kargo ve ödeme kuralları burada okunsa da nihai doğrulama sunucuda yapılır.
 */
export function useShopConfig() {
  return useContext(ShopConfigContext);
}

export function ShopConfigProvider({
  config,
  children,
}: {
  config: ShopConfig;
  children: ReactNode;
}) {
  return <ShopConfigContext.Provider value={config}>{children}</ShopConfigContext.Provider>;
}
