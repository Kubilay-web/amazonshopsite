import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserAddresses } from "@/lib/queries";
import { stripeConfigured } from "@/lib/stripe";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = { title: "Ödeme" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/checkout");

  const sp = await searchParams;
  const addresses = await getUserAddresses(user.id);

  return (
    <div className="mx-auto max-w-[1500px] px-2 py-4 sm:px-4">
      <h1 className="mb-4 text-2xl font-bold text-zinc-900">Siparişi tamamla</h1>

      {sp.canceled === "1" && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Ödeme iptal edildi. Siparişinizi tamamlamak için tekrar deneyebilirsiniz.
        </p>
      )}

      <CheckoutForm addresses={addresses} stripeEnabled={stripeConfigured} />
    </div>
  );
}
