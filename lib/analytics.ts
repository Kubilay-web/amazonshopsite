/**
 * Ziyaretçi analitiği için saf yardımcılar (referans çözümleme, cihaz ayrıştırma,
 * saat dilimi). Hem API route'undan hem raporlardan kullanılır; bu yüzden
 * `server-only` işaretlenmez ve veritabanına dokunmaz.
 */

export const ANALYTICS_TZ = "Europe/Istanbul";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ANALYTICS_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const hourFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: ANALYTICS_TZ,
  hour: "2-digit",
  hour12: false,
});

/** Türkiye saatine göre YYYY-MM-DD. Raporlar bu anahtara göre gruplanır. */
export function localDate(date: Date = new Date()) {
  return dateFormatter.format(date);
}

/** Türkiye saatine göre 0-23 arası saat. */
export function localHour(date: Date = new Date()) {
  return Number(hourFormatter.format(date)) % 24;
}

const DAY = 24 * 60 * 60 * 1000;

/** Bugünden `days` gün geriye giden gün anahtarları (eskiden yeniye). */
export function dateKeys(days: number, end: Date = new Date()) {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) keys.push(localDate(new Date(end.getTime() - i * DAY)));
  return keys;
}

// --------------------------------------------------------------- trafik kaynağı

/** Arama motorları — organik trafik olarak etiketlenir. */
const SEARCH_ENGINES: Record<string, string> = {
  google: "Google",
  bing: "Bing",
  yandex: "Yandex",
  duckduckgo: "DuckDuckGo",
  yahoo: "Yahoo",
  ecosia: "Ecosia",
  baidu: "Baidu",
  brave: "Brave Search",
};

/** Sosyal ağlar — sosyal trafik olarak etiketlenir. */
const SOCIAL_NETWORKS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X (Twitter)",
  "t.co": "X (Twitter)",
  x: "X (Twitter)",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  pinterest: "Pinterest",
  reddit: "Reddit",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  threads: "Threads",
};

export type TrafficSource = {
  source: string;
  /**
   * Kanal türü. Bilinen değerler: organic, social, referral, cpc, email,
   * affiliate, internal, none. UTM ile gelen serbest metinler olduğu gibi
   * saklanır; `MEDIUM_LABELS` içinde karşılığı yoksa ham hâliyle gösterilir.
   */
  medium: string;
  campaign: string;
};

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

/** Host'un anahtar listesindeki bir markaya ait olup olmadığına bakar. */
function matchBrand(host: string, table: Record<string, string>) {
  for (const [key, label] of Object.entries(table)) {
    if (host === key || host.startsWith(`${key}.`) || host.includes(`.${key}.`) || host.endsWith(`.${key}`)) {
      return label;
    }
  }
  return null;
}

/**
 * Ziyaretin nereden geldiğini çözer. Öncelik sırası:
 * UTM parametreleri → reklam tıklama kimliği → yönlendiren site → doğrudan.
 */
export function resolveSource(
  referrer: string,
  pageUrl: string,
  selfHost: string,
): TrafficSource {
  let params: URLSearchParams | null = null;
  try {
    params = new URL(pageUrl).searchParams;
  } catch {
    params = null;
  }

  const campaign = params?.get("utm_campaign")?.slice(0, 60) ?? "";
  const utmSource = params?.get("utm_source")?.slice(0, 60);
  const utmMedium = params?.get("utm_medium")?.slice(0, 30);

  if (utmSource) {
    // "internal" ayrılmış bir değerdir; dışarıdan gelen etiketler rapordaki
    // site içi filtresini bozmasın diye yönlendirmeye çevrilir.
    const medium = (utmMedium ?? "referral").toLowerCase();
    return {
      source: utmSource.toLowerCase(),
      medium: medium === "internal" ? "referral" : medium,
      campaign,
    };
  }

  // Google Ads / Microsoft Ads tıklama kimlikleri
  if (params?.get("gclid") || params?.get("gbraid") || params?.get("wbraid")) {
    return { source: "Google Ads", medium: "cpc", campaign };
  }
  if (params?.get("msclkid")) {
    return { source: "Microsoft Ads", medium: "cpc", campaign };
  }

  const host = hostOf(referrer);
  if (!host) return { source: "direct", medium: "none", campaign };

  const self = selfHost.replace(/^www\./, "").toLowerCase();
  if (self && (host === self || host.endsWith(`.${self}`))) {
    return { source: "(site içi)", medium: "internal", campaign };
  }

  const engine = matchBrand(host, SEARCH_ENGINES);
  if (engine) return { source: engine, medium: "organic", campaign };

  const social = matchBrand(host, SOCIAL_NETWORKS);
  if (social) return { source: social, medium: "social", campaign };

  return { source: host, medium: "referral", campaign };
}

export const MEDIUM_LABELS: Record<string, string> = {
  organic: "Arama",
  social: "Sosyal",
  referral: "Yönlendirme",
  cpc: "Reklam",
  email: "E-posta",
  affiliate: "İş ortağı",
  internal: "Site içi",
  none: "Doğrudan",
};

// ------------------------------------------------------------------ cihaz / bot

export type DeviceInfo = {
  device: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
};

/** User-agent'tan kaba cihaz/tarayıcı/işletim sistemi çıkarımı. */
export function parseUserAgent(ua: string): DeviceInfo {
  const device: DeviceInfo["device"] = /ipad|tablet|playbook|silk/i.test(ua)
    ? "tablet"
    : /mobi|android|iphone|ipod|phone/i.test(ua)
      ? "mobile"
      : "desktop";

  // Sıralama önemli: Edge ve Opera kendilerini Chrome olarak da tanıtır.
  const browser = /edg[ea]?\//i.test(ua)
    ? "Edge"
    : /opr\/|opera/i.test(ua)
      ? "Opera"
      : /samsungbrowser/i.test(ua)
        ? "Samsung Internet"
        : /firefox|fxios/i.test(ua)
          ? "Firefox"
          : /chrome|crios/i.test(ua)
            ? "Chrome"
            : /safari/i.test(ua)
              ? "Safari"
              : "Diğer";

  const os = /windows/i.test(ua)
    ? "Windows"
    : /android/i.test(ua)
      ? "Android"
      : /iphone|ipad|ipod/i.test(ua)
        ? "iOS"
        : /mac os x/i.test(ua)
          ? "macOS"
          : /linux/i.test(ua)
            ? "Linux"
            : "Diğer";

  return { device, browser, os };
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|bingpreview|headless|lighthouse|pingdom|uptime|monitor|preview|facebookexternalhit|whatsapp|telegram|curl|wget|python-requests|axios|node-fetch|go-http|java\/|okhttp|postman|scrapy|semrush|ahrefs|mj12|dotbot|petalbot|gptbot|claudebot|ccbot/i;

/** Bilinen tarayıcı dışı istemcileri eler. Kesin değildir, kaba filtredir. */
export function isBot(ua: string) {
  return !ua || ua.length < 10 || BOT_PATTERN.test(ua);
}

// -------------------------------------------------------------------- görüntüleme

const regionNames = new Intl.DisplayNames(["tr"], { type: "region" });

/** "TR" → "Türkiye". Tanınmayan kodlarda kodun kendisini döner. */
export function countryName(code: string) {
  if (!code || code.length !== 2) return "Bilinmiyor";
  try {
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** "TR" → 🇹🇷 (bayrak emojisi, bölgesel gösterge harfleriyle). */
export function countryFlag(code: string) {
  if (!code || code.length !== 2) return "🌍";
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return "🌍";
  return String.fromCodePoint(...[...upper].map((c) => 127397 + c.charCodeAt(0)));
}

export const DEVICE_LABELS: Record<string, string> = {
  desktop: "Masaüstü",
  mobile: "Telefon",
  tablet: "Tablet",
};
