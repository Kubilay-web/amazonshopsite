"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/components/providers/auth-provider";
import { CartProvider } from "@/components/providers/cart-provider";
import { WishlistProvider } from "@/components/providers/wishlist-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import type { AuthUser } from "@/types";

export function Providers({
  user,
  children,
}: {
  user: AuthUser | null;
  children: ReactNode;
}) {
  return (
    <AuthProvider user={user}>
      <ToastProvider>
        <WishlistProvider>
          <CartProvider>{children}</CartProvider>
        </WishlistProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
