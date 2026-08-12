import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata: Metadata = { title: "Giriş ve güvenlik" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login?redirect=/account/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { name: true, email: true, phone: true, image: true },
  });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-4xl px-3 py-6">
      <nav className="mb-2 text-sm text-zinc-600">
        <Link href="/account" className="text-amz-link hover:text-amz-link-hover">
          Hesabım
        </Link>
        <span className="mx-1">›</span>
        <span>Giriş ve güvenlik</span>
      </nav>

      <h1 className="mb-4 text-2xl font-bold text-zinc-900">Giriş ve güvenlik</h1>

      <ProfileForm user={user} />
    </div>
  );
}
