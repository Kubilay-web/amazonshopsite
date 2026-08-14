"use client";

import Script from "next/script";
import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Oturum kimliği yalnızca sekme ömrü boyunca yaşar (kalıcı çerez değildir). */
function sessionId() {
  try {
    const existing = sessionStorage.getItem("amz_sid");
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem("amz_sid", id);
    return id;
  } catch {
    return "";
  }
}

/**
 * Her gezinmede kendi toplayıcımıza tek bir istek atar. `sendBeacon`
 * kullanıldığı için sayfa kapanırken bile kayıp olmaz ve render'ı bloklamaz.
 */
function PageViewBeacon() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const query = searchParams.toString();
    const key = query ? `${pathname}?${query}` : pathname;
    // React'in geliştirme modundaki çift effect çağrısını da eler.
    if (lastSent.current === key) return;
    lastSent.current = key;

    const payload = JSON.stringify({
      path: pathname,
      url: window.location.href,
      title: document.title.slice(0, 160),
      referrer: document.referrer,
      sessionId: sessionId(),
      language: navigator.language,
    });

    try {
      const blob = new Blob([payload], { type: "application/json" });
      if (!navigator.sendBeacon?.("/api/analytics/collect", blob)) {
        void fetch("/api/analytics/collect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Analitik hiçbir koşulda sayfayı etkilemez.
    }
  }, [pathname, searchParams]);

  return null;
}

/**
 * Google Analytics 4 etiketi. Yalnızca üretimde ve ölçüm kimliği tanımlıysa
 * yüklenir; böylece yerel geliştirme trafiği GA raporlarına karışmaz.
 * Sayfa değişimlerini GA'nın "geliştirilmiş ölçüm" özelliği kendisi yakalar,
 * bu yüzden elle `page_view` gönderilmez (aksi halde çift sayılır).
 */
function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}');`}
      </Script>
    </>
  );
}

/**
 * Mağazanın ölçüm katmanı: kendi ziyaretçi kaydımız + (varsa) GA4.
 * Yönetim paneli her ikisinin de dışında tutulur.
 */
export function SiteAnalytics({ measurementId }: { measurementId?: string }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const gaEnabled = Boolean(measurementId) && process.env.NODE_ENV === "production";

  return (
    <>
      <Suspense fallback={null}>
        <PageViewBeacon />
      </Suspense>
      {!isAdmin && gaEnabled && <GoogleAnalytics measurementId={measurementId!} />}
    </>
  );
}
