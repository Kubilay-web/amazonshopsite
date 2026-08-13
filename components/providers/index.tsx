"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/components/providers/auth-provider";
import { CartProvider } from "@/components/providers/cart-provider";
import { WishlistProvider } from "@/components/providers/wishlist-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { ShopConfigProvider } from "@/components/providers/shop-config-provider";
import type { AuthUser, ShopConfig } from "@/types";

export function Providers({
  user,
  config,
  children,
}: {
  user: AuthUser | null;
  config: ShopConfig;
  children: ReactNode;
}) {
  return (
    <ShopConfigProvider config={config}>
      <AuthProvider user={user}>
        <ToastProvider>
          <WishlistProvider>
            <CartProvider>{children}</CartProvider>
          </WishlistProvider>
        </ToastProvider>
      </AuthProvider>
    </ShopConfigProvider>
  );
}
