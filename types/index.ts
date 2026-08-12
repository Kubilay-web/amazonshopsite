export type Role = "USER" | "ADMIN";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  image: string | null;
};

export type CartLine = {
  productId: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  discountPercent: number;
  qty: number;
  size: string | null;
  color: string | null;
  stock: number;
};

export type ProductCardData = {
  id: string;
  title: string;
  slug: string;
  images: string[];
  price: number;
  discountPercent: number;
  rating: number;
  numReviews: number;
  stock: number;
  brand: string | null;
  shippingFree: boolean;
};

export type ApiError = {
  message: string;
  fields?: Record<string, string>;
};
