import "server-only";
import Stripe from "stripe";

export const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

let client: Stripe | null = null;

/** Stripe anahtarı yoksa null döner; site kapıda ödeme ile çalışmaya devam eder. */
export function getStripe(): Stripe | null {
  if (!stripeConfigured) return null;
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      typescript: true,
    });
  }
  return client;
}

export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
