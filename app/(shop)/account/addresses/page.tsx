import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserAddresses } from "@/lib/queries";
import { AddressManager } from "@/components/account/address-manager";

export const metadata: Metadata = { title: "Adreslerim" };
export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/account/addresses");

  const addresses = await getUserAddresses(user.id);

  return (
    <div className="mx-auto max-w-5xl px-3 py-6">
      <nav className="mb-2 text-sm text-zinc-600">
        <Link href="/account" className="text-amz-link hover:text-amz-link-hover">
          Hesabım
        </Link>
        <span className="mx-1">›</span>
        <span>Adreslerim</span>
      </nav>

      <h1 className="mb-4 text-2xl font-bold text-zinc-900">Adreslerim</h1>

      <AddressManager addresses={addresses} />
    </div>
  );
}
