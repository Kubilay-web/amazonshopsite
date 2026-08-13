import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { getSettings } from "@/lib/settings";

const columns = [
  {
    title: "Bizi tanıyın",
    links: [
      { label: "Hakkımızda", href: "/" },
      { label: "Kariyer", href: "/" },
      { label: "Basın", href: "/" },
      { label: "Sürdürülebilirlik", href: "/" },
    ],
  },
  {
    title: "Bizimle kazanın",
    links: [
      { label: "Satış yapın", href: "/" },
      { label: "Kurumsal satış", href: "/" },
      { label: "İş ortaklığı", href: "/" },
      { label: "Reklam verin", href: "/" },
    ],
  },
  {
    title: "Ödeme seçenekleri",
    links: [
      { label: "Kredi kartı", href: "/" },
      { label: "Kapıda ödeme", href: "/" },
      { label: "Taksit seçenekleri", href: "/" },
      { label: "Hediye kartları", href: "/" },
    ],
  },
  {
    title: "Yardım",
    links: [
      { label: "Siparişlerim", href: "/account/orders" },
      { label: "Kargo takibi", href: "/account/orders" },
      { label: "İade ve değişim", href: "/" },
      { label: "Müşteri hizmetleri", href: "/" },
    ],
  },
];

export async function Footer() {
  const settings = await getSettings();
  const socials = [
    { label: "Facebook", href: settings.facebook },
    { label: "Instagram", href: settings.instagram },
    { label: "X", href: settings.twitter },
    { label: "YouTube", href: settings.youtube },
  ].filter((s) => s.href.trim().length > 0);

  return (
    <footer className="mt-10">
      <a
        href="#top"
        className="block bg-amz-nav-hover py-3.5 text-center text-sm text-white transition hover:bg-[#485769]"
      >
        <span className="inline-flex items-center gap-2">
          <ArrowUp className="size-4" /> Başa dön
        </span>
      </a>

      <div className="bg-amz-nav text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-2 text-sm font-bold">{column.title}</h3>
              <ul className="space-y-1.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-zinc-300 hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amz-dark py-6 text-center text-xs text-zinc-400">
        <Link href="/" className="mb-2 inline-flex items-end">
          <span className="text-lg font-bold text-white">{settings.siteName}</span>
          <span className="mb-1 ml-0.5 h-1 w-3 rounded-full bg-amz-orange" />
        </Link>

        {socials.length > 0 && (
          <div className="mb-2 flex justify-center gap-4">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 hover:text-white hover:underline"
              >
                {social.label}
              </a>
            ))}
          </div>
        )}

        {(settings.supportEmail || settings.supportPhone || settings.contactAddress) && (
          <p className="mb-2">
            {[settings.supportEmail, settings.supportPhone, settings.contactAddress]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        <p>
          © {new Date().getFullYear()} {settings.siteName} — Eğitim amaçlı demo projedir.
          Gerçek Amazon.com ile ilişkisi yoktur.
        </p>
      </div>
    </footer>
  );
}
