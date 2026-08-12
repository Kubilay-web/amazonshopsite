import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-4 py-6">
      <Link href="/" className="mb-4 flex items-end">
        <span className="text-3xl font-bold tracking-tight text-zinc-900">amazon</span>
        <span className="mb-1.5 ml-1 h-1.5 w-5 rounded-full bg-amz-orange" />
      </Link>

      <div className="w-full max-w-sm">{children}</div>

      <div className="mt-8 w-full max-w-md border-t border-amz-border pt-5 text-center text-xs text-zinc-500">
        <div className="mb-2 flex justify-center gap-4">
          <Link href="/" className="text-amz-link hover:text-amz-link-hover">
            Kullanım koşulları
          </Link>
          <Link href="/" className="text-amz-link hover:text-amz-link-hover">
            Gizlilik bildirimi
          </Link>
          <Link href="/" className="text-amz-link hover:text-amz-link-hover">
            Yardım
          </Link>
        </div>
        © {new Date().getFullYear()} Amazon Clone — demo proje
      </div>
    </div>
  );
}
