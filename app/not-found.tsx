import Link from "next/link";
import { PackageX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <PackageX className="size-16 text-zinc-300" strokeWidth={1.5} />
      <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Sayfa bulunamadı</h1>
      <p className="max-w-md text-zinc-600">
        Aradığınız sayfa taşınmış veya kaldırılmış olabilir. Ana sayfadan alışverişe devam
        edebilirsiniz.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn-amz">
          Ana sayfaya dön
        </Link>
        <Link href="/search" className="btn-amz-outline">
          Tüm ürünler
        </Link>
      </div>
    </div>
  );
}
